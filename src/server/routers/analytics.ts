import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { autoForecast } from "@/lib/forecast";

export const analyticsRouter = router({
  cogsOverTime: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const sales = await ctx.prisma.sale.findMany({
        where: { tenantId: input.tenantId, soldAt: { gte: since } },
        include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
        orderBy: { soldAt: "asc" },
      });

      const byDay = new Map<string, { revenue: number; cogs: number; date: string }>();

      for (const sale of sales) {
        const day = sale.soldAt.toISOString().split("T")[0];
        let cogs = 0;
        for (const line of sale.recipe.ingredients) {
          cogs +=
            (line.quantity / sale.recipe.yieldPct) * line.ingredient.costPerUnit * sale.qty;
        }
        const existing = byDay.get(day);
        if (existing) {
          existing.revenue += sale.revenue;
          existing.cogs += cogs;
        } else {
          byDay.set(day, { revenue: sale.revenue, cogs, date: day });
        }
      }

      return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    }),

  topRecipes: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const sales = await ctx.prisma.sale.findMany({
        where: { tenantId: input.tenantId, soldAt: { gte: since } },
        include: { recipe: true },
      });

      const byRecipe = new Map<
        string,
        { recipeName: string; totalQty: number; totalRevenue: number }
      >();

      for (const sale of sales) {
        const key = sale.recipeId;
        const existing = byRecipe.get(key);
        if (existing) {
          existing.totalQty += sale.qty;
          existing.totalRevenue += sale.revenue;
        } else {
          byRecipe.set(key, {
            recipeName: sale.recipe.name,
            totalQty: sale.qty,
            totalRevenue: sale.revenue,
          });
        }
      }

      return Array.from(byRecipe.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);
    }),

  wasteByIngredient: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const logs = await ctx.prisma.wasteLog.findMany({
        where: { tenantId: input.tenantId, createdAt: { gte: since } },
        include: { ingredient: true },
      });

      const byIngredient = new Map<
        string,
        { name: string; totalQty: number; totalCost: number }
      >();

      for (const log of logs) {
        const key = log.ingredientId;
        const cost = log.qty * log.ingredient.costPerUnit;
        const existing = byIngredient.get(key);
        if (existing) {
          existing.totalQty += log.qty;
          existing.totalCost += cost;
        } else {
          byIngredient.set(key, {
            name: log.ingredient.name,
            totalQty: log.qty,
            totalCost: cost,
          });
        }
      }

      return Array.from(byIngredient.values()).sort((a, b) => b.totalCost - a.totalCost);
    }),

  overview: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [ingredientCount, lowStockCount, pendingOrders, recentRevenue, recentWasteCost] =
        await Promise.all([
          ctx.prisma.ingredient.count({ where: { tenantId: input.tenantId, active: true } }),
          ctx.prisma.ingredient.count({
            where: {
              tenantId: input.tenantId,
              active: true,
              currentStock: { lte: ctx.prisma.ingredient.fields.reorderPoint },
            },
          }),
          ctx.prisma.purchaseOrder.count({
            where: {
              tenantId: input.tenantId,
              status: { in: ["DRAFT", "SENT", "CONFIRMED"] },
            },
          }),
          ctx.prisma.sale
            .aggregate({
              where: { tenantId: input.tenantId, soldAt: { gte: thirtyDaysAgo } },
              _sum: { revenue: true },
            })
            .then((r) => r._sum.revenue ?? 0),
          ctx.prisma.wasteLog
            .findMany({
              where: { tenantId: input.tenantId, createdAt: { gte: thirtyDaysAgo } },
              include: { ingredient: true },
            })
            .then((logs) =>
              logs.reduce((sum, l) => sum + l.qty * l.ingredient.costPerUnit, 0)
            ),
        ]);

      return {
        ingredientCount,
        lowStockCount,
        pendingOrders,
        recentRevenue,
        recentWasteCost,
      };
    }),

  /**
   * Core feature: what to bake for the next `horizon` days.
   * - Runs autoForecast() on each recipe's 90-day sales history
   * - Explodes the BOM to compute ingredient requirements
   * - Cross-references current stock to flag shortfalls
   */
  productionPlan: protectedProcedure
    .input(z.object({ tenantId: z.string(), horizon: z.number().int().min(1).max(14).default(7) }))
    .query(async ({ input, ctx }) => {
      const { tenantId, horizon } = input;
      const HISTORY_DAYS = 90;
      const since = new Date();
      since.setDate(since.getDate() - HISTORY_DAYS);

      const [recipes, allSales, ingredients] = await Promise.all([
        ctx.prisma.recipe.findMany({
          where: { tenantId, active: true },
          include: { ingredients: { include: { ingredient: true } } },
        }),
        ctx.prisma.sale.findMany({
          where: { tenantId, soldAt: { gte: since } },
          orderBy: { soldAt: "asc" },
        }),
        ctx.prisma.ingredient.findMany({ where: { tenantId, active: true } }),
      ]);

      const stockMap = new Map(ingredients.map((i) => [i.id, i.currentStock]));

      // Horizon dates (tomorrow = day 1)
      const horizonDates = Array.from({ length: horizon }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return d.toISOString().split("T")[0];
      });

      const plans = recipes.map((recipe) => {
        // Dense daily sales series
        const byDay = new Map<string, number>();
        for (const s of allSales.filter((s) => s.recipeId === recipe.id)) {
          const day = s.soldAt.toISOString().split("T")[0];
          byDay.set(day, (byDay.get(day) ?? 0) + s.qty);
        }
        const series: number[] = [];
        for (let i = 0; i < HISTORY_DAYS; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          series.push(byDay.get(d.toISOString().split("T")[0]) ?? 0);
        }

        const fc = autoForecast(series, horizon);
        const weeklyForecast = horizonDates.map((date, i) => ({
          date,
          units: Math.max(0, Math.round(fc.forecastHorizon[i])),
        }));
        const tomorrowUnits = weeklyForecast[0].units;

        return {
          recipeId: recipe.id,
          recipeName: recipe.name,
          batchSize: recipe.batchSize,
          method: fc.method,
          metrics: fc.metrics,
          tomorrowUnits,
          weeklyForecast,
          bom: recipe.ingredients.map((line) => ({
            ingredientId: line.ingredientId,
            name: line.ingredient.name,
            unit: line.ingredient.unit,
            qtyPerBatch: line.quantity,
            requiredTomorrow: tomorrowUnits * line.quantity,
          })),
        };
      });

      // Aggregate ingredient requirements for tomorrow
      const needMap = new Map<
        string,
        { name: string; unit: string; required: number; available: number }
      >();
      for (const plan of plans) {
        for (const line of plan.bom) {
          if (line.requiredTomorrow === 0) continue;
          const existing = needMap.get(line.ingredientId);
          if (existing) {
            existing.required += line.requiredTomorrow;
          } else {
            needMap.set(line.ingredientId, {
              name: line.name,
              unit: line.unit,
              required: line.requiredTomorrow,
              available: stockMap.get(line.ingredientId) ?? 0,
            });
          }
        }
      }

      const ingredientCheck = Array.from(needMap.values())
        .map((i) => ({ ...i, deficit: Math.max(0, i.required - i.available) }))
        .sort((a, b) => b.deficit - a.deficit); // worst shortfalls first

      return { plans, ingredientCheck, horizonDates };
    }),

  supplier: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.supplier.findMany({
        where: { tenantId: input.tenantId },
        include: { _count: { select: { ingredients: true, orders: true } } },
        orderBy: { name: "asc" },
      });
    }),

  createSupplier: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.supplier.create({ data: input });
    }),

  updateSupplier: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ...data } = input;
      return ctx.prisma.supplier.update({ where: { id }, data });
    }),
});
