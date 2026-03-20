// Analytics tRPC router
// Provides dashboard KPIs, waste analytics, and demand forecasting.
// All procedures are read-only (queries only).

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  // Overview KPIs for the dashboard: ingredient count, low stock count, waste cost
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

        // Recent waste logs to calculate total waste count
        ctx.prisma.wasteLog.findMany({
          where: { tenantId: input.tenantId, date: { gte: thirtyDaysAgo } },
        }),
      ]);

      // Total units wasted in last 30 days (qtyBaked - qtySold across all logs)
      const recentWasteUnits = recentLogs.reduce(
        (sum, l) => sum + (l.qtyBaked - l.qtySold),
        0
      );

      return { ingredientCount, lowStockCount, recentWasteUnits };
    }),

  // Waste breakdown by product over N days — used by analytics page
  wasteByProduct: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const logs = await ctx.prisma.wasteLog.findMany({
        where:   { tenantId: input.tenantId, date: { gte: since } },
        include: { recipe: true },
        orderBy: { date: "asc" },
      });

      // Group by product
      const byProduct = new Map<string, {
        productName:     string;
        totalBaked:      number;
        totalSold:       number;
        totalWasted:     number;
        wasteRate:       number; // percentage wasted
      }>();

      for (const log of logs) {
        const wasted   = log.qtyBaked - log.qtySold;
        const existing = byProduct.get(log.recipeId);
        if (existing) {
          existing.totalBaked  += log.qtyBaked;
          existing.totalSold   += log.qtySold;
          existing.totalWasted += wasted;
          existing.wasteRate    = existing.totalBaked > 0
            ? (existing.totalWasted / existing.totalBaked) * 100 : 0;
        } else {
          byProduct.set(log.recipeId, {
            productName: log.recipe.name,
            totalBaked:  log.qtyBaked,
            totalSold:   log.qtySold,
            totalWasted: wasted,
            wasteRate:   log.qtyBaked > 0 ? (wasted / log.qtyBaked) * 100 : 0,
          });
        }
      }

      return Array.from(byProduct.values()).sort((a, b) => b.totalWasted - a.totalWasted);
    }),

  // Day-of-week waste breakdown — "You waste most on Mondays"
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

      // Return Mon–Sun order (skip Sunday index 0, append it at end for bakery context)
      return [...byDay.slice(1), byDay[0]];
    }),

  // Demand forecast for today — core feature of the app
  // For each product, looks at the last N same-day-of-week logs and suggests a bake qty.
  // Also checks ingredient feasibility: do we have enough stock to meet the suggestion?
  demandForecast: protectedProcedure
    .input(z.object({ tenantId: z.string(), date: z.string() }))
    .query(async ({ input, ctx }) => {
      const today  = new Date(input.date);
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
        // Historical logs for the same day of week
        ctx.prisma.wasteLog.findMany({
          where: { tenantId: input.tenantId, date: { gte: twelveWeeksAgo } },
        }),
      ]);

      // Build a stock lookup map for quick access: ingredientId → currentStock
      const stockMap = new Map(ingredients.map((i) => [i.id, i.currentStock]));

      // For each product, calculate demand forecast and feasibility
      const forecasts = recipes.map((recipe) => {
        // Filter historical logs for this product on the same day of week
        const sameDayLogs = historicalLogs.filter(
          (l) => l.recipeId === recipe.id && new Date(l.date).getDay() === dayOfWeek
        );

        // Not enough data — need at least 2 data points for a meaningful average
        if (sameDayLogs.length < 2) {
          return {
            productId:    recipe.id,
            productName:  recipe.name,
            weeksOfData:  sameDayLogs.length,
            suggestedQty: null,
            avgSold:      null,
            feasible:     null,
            maxFeasible:  null,
            shortfalls:   [],
          };
        }

        // Average units sold on this day of week (add 10% buffer for safety)
        const avgSold     = sameDayLogs.reduce((s, l) => s + l.qtySold, 0) / sameDayLogs.length;
        const suggestedQty = Math.ceil(avgSold * 1.1);

        // Feasibility check: do we have enough of each ingredient?
        // batches needed = suggestedQty / recipe.batchSize
        const batchesNeeded = suggestedQty / recipe.batchSize;
        const shortfalls: { ingredientName: string; needed: number; available: number; short: number }[] = [];

        for (const line of recipe.ingredients) {
          const needed    = line.quantity * batchesNeeded;
          const available = stockMap.get(line.ingredientId) ?? 0;
          if (available < needed) {
            shortfalls.push({
              ingredientName: line.ingredient.name,
              needed:         Math.round(needed * 100) / 100,
              available:      Math.round(available * 100) / 100,
              short:          Math.round((needed - available) * 100) / 100,
            });
          }
        }

        // Calculate max feasible qty given current stock
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
