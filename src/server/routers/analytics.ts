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

      const [ingredientCount, lowStockCount, recentLogs] = await Promise.all([
        // Total active ingredients in the pantry
        ctx.prisma.ingredient.count({
          where: { tenantId: input.tenantId, active: true },
        }),

        // Ingredients at or below their low-stock alert threshold
        ctx.prisma.ingredient.count({
          where: {
            tenantId:     input.tenantId,
            active:       true,
            currentStock: { lte: ctx.prisma.ingredient.fields.reorderPoint },
          },
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
   * For each active product, looks at the last 12 weeks of same-day-of-week
   * WasteLogs to calculate average units sold. Suggests baking avg × 1.1 (10% buffer).
   *
   * Also runs a feasibility check: given the suggested qty, do we have enough
   * of every ingredient in stock? Returns shortfalls for any ingredient that
   * would run out, plus the maximum feasible qty if we're short.
   *
   * Returns null for suggestedQty when fewer than 2 data points exist.
   */
  demandForecast: protectedProcedure
    .input(z.object({ tenantId: z.string(), date: z.string() }))
    .query(async ({ input, ctx }) => {
      const today     = new Date(input.date);
      const dayOfWeek = today.getDay(); // 0=Sun ... 6=Sat

      // Look back 12 weeks for same-day historical data
      const twelveWeeksAgo = new Date(today);
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      // Fetch all active products with their BOM and current ingredient stock
      const [recipes, ingredients, historicalLogs] = await Promise.all([
        ctx.prisma.recipe.findMany({
          where:   { tenantId: input.tenantId, active: true },
          include: { ingredients: { include: { ingredient: true } } },
        }),
        ctx.prisma.ingredient.findMany({
          where: { tenantId: input.tenantId, active: true },
        }),
        // All historical logs (we'll filter by day-of-week per product in JS)
        ctx.prisma.wasteLog.findMany({
          where: { tenantId: input.tenantId, date: { gte: twelveWeeksAgo } },
        }),
      ]);

      // Build a stock lookup map: ingredientId → currentStock
      const stockMap = new Map(ingredients.map((i) => [i.id, i.currentStock]));

      // For each product, calculate demand forecast and feasibility check
      const forecasts = recipes.map((recipe) => {
        // Same-day-of-week historical logs for this product only
        const sameDayLogs = historicalLogs.filter(
          (l) => l.recipeId === recipe.id && new Date(l.date).getDay() === dayOfWeek
        );

        // Need ≥2 data points for a meaningful average
        if (sameDayLogs.length < 2) {
          return {
            productId:    recipe.id,
            productName:  recipe.name,
            weeksOfData:  sameDayLogs.length,
            suggestedQty: null,
            avgSold:      null,
            feasible:     null,
            maxFeasible:  null,
            shortfalls:   [] as { ingredientName: string; needed: number; available: number; short: number }[],
          };
        }

        // Average units sold on this day of week, rounded up with 10% safety buffer
        const avgSold      = sameDayLogs.reduce((s, l) => s + l.qtySold, 0) / sameDayLogs.length;
        const suggestedQty = Math.ceil(avgSold * 1.1);

        // Feasibility: how many batches do we need, and do we have the ingredients?
        const batchesNeeded = suggestedQty / recipe.batchSize;
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

        // Max feasible qty given current stock (limited by the most constrained ingredient)
        let maxFeasible = suggestedQty;
        for (const line of recipe.ingredients) {
          const available      = stockMap.get(line.ingredientId) ?? 0;
          const qtyPerUnit     = line.quantity / recipe.batchSize;
          const maxFromThisIng = qtyPerUnit > 0 ? Math.floor(available / qtyPerUnit) : Infinity;
          maxFeasible = Math.min(maxFeasible, maxFromThisIng);
        }

        return {
          productId:    recipe.id,
          productName:  recipe.name,
          weeksOfData:  sameDayLogs.length,
          suggestedQty,
          avgSold:      Math.round(avgSold * 10) / 10,
          feasible:     shortfalls.length === 0,
          maxFeasible,
          shortfalls,
        };
      });

      return forecasts;
    }),
});
