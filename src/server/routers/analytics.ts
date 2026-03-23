/**
 * Analytics tRPC router
 *
 * Provides dashboard KPIs, waste analytics, and demand forecasting.
 * All procedures are read-only (queries only) and scoped to a tenantId.
 *
 * Cost calculations: when ingredients have a `costPerUnit` set, the analytics
 * procedures compute waste cost in dollars. For example, if you wasted 3 croissants
 * and a croissant uses 300g butter at $0.009/gram + 500g flour at $0.002/gram,
 * the cost of those 3 wasted croissants is calculated from the BOM.
 *
 * Procedures:
 *   overview          — Dashboard KPIs: ingredient count, low stock, waste units + cost
 *   wasteByProduct    — Per-product waste breakdown with cost (last N days)
 *   wasteByDayOfWeek  — Day-of-week waste pattern (last N days)
 *   demandForecast    — Core feature: per-product bake suggestions + feasibility
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  selectTier, wma, holtWinters, computeMAD, computeBias,
  isEventDay, findActiveEvent, round1dp,
  type EventRecord,
} from "@/lib/forecast";

export const analyticsRouter = router({
  /**
   * Overview KPIs for the main dashboard.
   * Returns: ingredient count, low stock count, waste units and cost over 30 days.
   *
   * Cost is only non-zero when ingredients have costPerUnit configured.
   * The UI falls back gracefully to showing "—" when no costs are set.
   */
  overview: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [ingredients, recentLogs] = await Promise.all([
        // Fetch all active ingredients to compute counts in JS
        // (Prisma cannot compare two columns in a count filter)
        ctx.prisma.ingredient.findMany({
          where:  { tenantId: input.tenantId, active: true },
          select: { currentStock: true, reorderPoint: true },
        }),

        // Waste logs with recipe + BOM so we can calculate ingredient cost of waste
        ctx.prisma.wasteLog.findMany({
          where:   { tenantId: input.tenantId, date: { gte: thirtyDaysAgo } },
          include: {
            recipe: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
        }),
      ]);

      const ingredientCount = ingredients.length;
      const lowStockCount = ingredients.filter(
        (i) => i.reorderPoint > 0 && i.currentStock <= i.reorderPoint
      ).length;

      // Total units wasted (qtyBaked - qtySold) across all logs in 30d
      const recentWasteUnits = recentLogs.reduce(
        (sum, l) => sum + (l.qtyBaked - l.qtySold),
        0
      );

      // Total cost of wasted product over 30 days.
      // For each log: cost = sum(line.quantity × batchesWasted × ingredient.costPerUnit)
      // Only non-zero when ingredients have costPerUnit set.
      const wasteCost30d = recentLogs.reduce((sum, log) => {
        const qtyWasted = log.qtyBaked - log.qtySold;
        if (qtyWasted <= 0) return sum;
        const batchesWasted = qtyWasted / log.recipe.batchSize;
        const logCost = log.recipe.ingredients.reduce((s, line) => {
          const cost = line.ingredient.costPerUnit ?? 0;
          return s + line.quantity * batchesWasted * cost;
        }, 0);
        return sum + logCost;
      }, 0);

      return { ingredientCount, lowStockCount, recentWasteUnits, wasteCost30d };
    }),

  /**
   * Waste breakdown by product — used by the analytics page.
   * Groups WasteLog entries by product and aggregates baked/sold/wasted/cost.
   * Includes cost of waste per product (zero if no ingredient costs configured).
   */
  wasteByProduct: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Include recipe → BOM → ingredient so we can compute ingredient cost of waste
      const logs = await ctx.prisma.wasteLog.findMany({
        where:   { tenantId: input.tenantId, date: { gte: since } },
        include: {
          recipe: {
            include: {
              ingredients: { include: { ingredient: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      });

      // Group by product and accumulate totals
      const byProduct = new Map<string, {
        productName:  string;
        totalBaked:   number;
        totalSold:    number;
        totalWasted:  number;
        costOfWaste:  number;  // $0 when no ingredient costs configured
        wasteRate:    number;  // percentage wasted
      }>();

      for (const log of logs) {
        const wasted       = log.qtyBaked - log.qtySold;
        const batchesWasted = wasted / log.recipe.batchSize;

        // Dollar cost of this log's waste: sum ingredient cost × qty used × batches wasted
        const costOfWaste = batchesWasted > 0
          ? log.recipe.ingredients.reduce((s, line) => {
              return s + line.quantity * batchesWasted * (line.ingredient.costPerUnit ?? 0);
            }, 0)
          : 0;

        const existing = byProduct.get(log.recipeId);
        if (existing) {
          existing.totalBaked  += log.qtyBaked;
          existing.totalSold   += log.qtySold;
          existing.totalWasted += wasted;
          existing.costOfWaste += costOfWaste;
          existing.wasteRate    = existing.totalBaked > 0
            ? (existing.totalWasted / existing.totalBaked) * 100 : 0;
        } else {
          byProduct.set(log.recipeId, {
            productName: log.recipe.name,
            totalBaked:  log.qtyBaked,
            totalSold:   log.qtySold,
            totalWasted: wasted,
            costOfWaste,
            wasteRate:   log.qtyBaked > 0 ? (wasted / log.qtyBaked) * 100 : 0,
          });
        }
      }

      return Array.from(byProduct.values()).sort((a, b) => b.totalWasted - a.totalWasted);
    }),

  /**
   * Day-of-week waste breakdown — "You waste most on Mondays".
   * Returns Mon–Sun (bakery-friendly order) with totalBaked and totalWasted per day.
   */
  wasteByDayOfWeek: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(90) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const logs = await ctx.prisma.wasteLog.findMany({
        where: { tenantId: input.tenantId, date: { gte: since } },
      });

      // Day names indexed 0=Sunday ... 6=Saturday
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const byDay    = Array.from({ length: 7 }, (_, i) => ({
        dayName:     dayNames[i],
        totalBaked:  0,
        totalWasted: 0,
        days:        0,
      }));

      for (const log of logs) {
        const dow = new Date(log.date).getDay(); // 0=Sun, 6=Sat
        byDay[dow].totalBaked  += log.qtyBaked;
        byDay[dow].totalWasted += log.qtyBaked - log.qtySold;
        byDay[dow].days++;
      }

      // Return Mon–Sun order (skip Sunday index 0, append it at end — bakery context)
      return [...byDay.slice(1), byDay[0]];
    }),

  /**
   * Demand forecast for a given date — the core feature of the app.
   *
   * Tiered model progression:
   *   0 same-day logs:  no prediction (suggestedQty = null)
   *   1–7 same-day logs: Weighted Moving Average (last 3, weights 0.5/0.3/0.2)
   *   8+ same-day logs: Holt-Winters triple exponential smoothing (s=7, multiplicative)
   *
   * Event/promo multipliers are applied on top of the base forecast.
   * Event-day logs are excluded from training to prevent holiday drift.
   *
   * Also runs a feasibility check: given suggestedQty, do we have enough
   * ingredients in stock? Returns shortfalls and maxFeasible qty.
   */
  demandForecast: protectedProcedure
    .input(z.object({ tenantId: z.string(), date: z.string() }))
    .query(async ({ input, ctx }) => {
      // 10% safety buffer applied to raw model output before showing to baker
      const FORECAST_BUFFER = 1.1;

      const today     = new Date(input.date);
      const targetDOW = today.getUTCDay(); // fix: getUTCDay not getDay (timezone safety)

      // 52-week lookback — HW needs fuller history than the old 12-week window
      const fiftyTwoWeeksAgo = new Date(today);
      fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 364);

      // Parallel fetch: recipes+BOM, stock, historical logs, all tenant events
      const [recipes, ingredients, historicalLogs, allPrismaEvents] = await Promise.all([
        ctx.prisma.recipe.findMany({
          where:   { tenantId: input.tenantId, active: true },
          include: { ingredients: { include: { ingredient: true } } },
        }),
        ctx.prisma.ingredient.findMany({
          where: { tenantId: input.tenantId, active: true },
        }),
        ctx.prisma.wasteLog.findMany({
          where: { tenantId: input.tenantId, date: { gte: fiftyTwoWeeksAgo } },
        }),
        ctx.prisma.forecastEvent.findMany({
          where: { tenantId: input.tenantId },
        }),
      ]);

      // Map Prisma events → lean EventRecord (keeps forecast.ts free of Prisma)
      const eventRecords: EventRecord[] = allPrismaEvents.map((e) => ({
        date:           e.date,
        multiplier:     e.multiplier,
        recipeId:       e.recipeId,
        repeatAnnually: e.repeatAnnually,
        createdAt:      e.createdAt,
        name:           e.name,
      }));

      // Stock lookup: ingredientId → currentStock
      const stockMap = new Map(ingredients.map((i) => [i.id, i.currentStock]));

      // Helper
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

      const forecasts = recipes.map((recipe) => {
        // All logs for this product in the 52-week window
        const productLogs = historicalLogs.filter((l) => l.recipeId === recipe.id);

        // Exclude event-day logs from training — prevents holiday spikes from
        // drifting the baseline forecast upward over time (Amendment 3)
        const cleanLogs = productLogs.filter(
          (l) => !isEventDay(new Date(l.date), eventRecords, recipe.id)
        );

        // Same-day-of-week logs, event days excluded, sorted oldest-first
        const sameDayLogs = cleanLogs
          .filter((l) => new Date(l.date).getUTCDay() === targetDOW)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const sameDaySeries = sameDayLogs.map((l) => l.qtySold);
        const tier          = selectTier(sameDayLogs.length);

        // ── Run the appropriate model ──────────────────────────────────────
        let rawF: number | null = null;
        let residuals: number[] = [];

        if (tier === "wma") {
          rawF = wma(sameDaySeries);
        } else if (tier === "holt-winters") {
          const dailyPoints = cleanLogs
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((l) => ({ date: new Date(l.date), qtySold: l.qtySold }));
          const hw  = holtWinters(dailyPoints, today);
          rawF      = hw.forecast;
          residuals = hw.residuals;
        }

        // ── Apply buffer ───────────────────────────────────────────────────
        const baseQty = rawF !== null ? Math.ceil(rawF * FORECAST_BUFFER) : null;

        // ── Event multiplier (applied to baseQty, not rawF) ────────────────
        // Semantics: baker's ×N means N× their normal safe production target
        const activeEvent  = findActiveEvent(eventRecords, today, recipe.id);
        const suggestedQty = baseQty !== null && activeEvent
          ? Math.ceil(baseQty * activeEvent.multiplier)
          : baseQty;

        // ── MAD/Bias — tier-appropriate (Amendment 1) ─────────────────────
        const rawMad  = tier === "holt-winters"
          ? (residuals.length > 0 ? mean(residuals.map(Math.abs)) : null)
          : computeMAD(sameDaySeries);
        const rawBias = tier === "holt-winters"
          ? (residuals.length > 0 ? mean(residuals) : null)
          : computeBias(sameDaySeries);
        const mad  = rawMad  !== null ? round1dp(rawMad)  : null;
        const bias = rawBias !== null ? round1dp(rawBias) : null;

        // ── avgSold (display only) ─────────────────────────────────────────
        const avgSold = sameDaySeries.length > 0
          ? round1dp(mean(sameDaySeries))
          : null;

        // ── Feasibility check (unchanged logic, uses final suggestedQty) ───
        const qty = suggestedQty ?? 0;
        const batchesNeeded = qty / recipe.batchSize;
        const shortfalls: { ingredientName: string; needed: number; available: number; short: number }[] = [];

        for (const line of recipe.ingredients) {
          const needed    = line.quantity * batchesNeeded;
          const available = stockMap.get(line.ingredientId) ?? 0;
          if (available < needed) {
            shortfalls.push({
              ingredientName: line.ingredient.name,
              needed:         Math.round(needed    * 100) / 100,
              available:      Math.round(available * 100) / 100,
              short:          Math.round((needed - available) * 100) / 100,
            });
          }
        }

        let maxFeasible = qty;
        for (const line of recipe.ingredients) {
          const available      = stockMap.get(line.ingredientId) ?? 0;
          const qtyPerUnit     = line.quantity / recipe.batchSize;
          const maxFromThisIng = qtyPerUnit > 0 ? Math.floor(available / qtyPerUnit) : Infinity;
          maxFeasible = Math.min(maxFeasible, maxFromThisIng);
        }

        // Urgency: critical if ingredient short, warning if any BOM ingredient
        // is at/below its reorder point, none if no data, ok otherwise
        const hasLowStockIngredient = recipe.ingredients.some((line) => {
          const { currentStock, reorderPoint } = line.ingredient;
          return reorderPoint > 0 && currentStock <= reorderPoint;
        });
        const urgency: "critical" | "warning" | "ok" | "none" =
          shortfalls.length > 0  ? "critical"
          : suggestedQty === null ? "none"
          : hasLowStockIngredient ? "warning"
          : "ok";

        return {
          productId:     recipe.id,
          productName:   recipe.name,
          model:         tier,
          dataPoints:    sameDayLogs.length,
          suggestedQty,
          baseQty,
          bufferApplied: FORECAST_BUFFER,
          avgSold,
          mad,
          bias,
          urgency,
          activeEvent:   activeEvent
            ? { name: activeEvent.name, multiplier: activeEvent.multiplier }
            : null,
          feasible:      suggestedQty !== null ? shortfalls.length === 0 : null,
          maxFeasible,
          shortfalls,
        };
      });

      // Sort: critical first, then warning, ok, none — most urgent at top
      const urgencyOrder = { critical: 0, warning: 1, ok: 2, none: 3 } as const;
      return forecasts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    }),
});
