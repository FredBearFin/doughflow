// End-of-day bake log router
// Bakers log what was baked and what was sold at end of day per product.
// qtyWasted is derived: qtyBaked - qtySold
// When a log is submitted, ingredient stock is decremented via the product's BOM.

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const wasteRouter = router({
  // Log end-of-day bake results for a product.
  // Automatically decrements ingredient stock based on the product's BOM.
  log: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        recipeId: z.string(),
        date:     z.string(), // ISO date string e.g. "2026-03-19"
        qtyBaked: z.number().int().min(1),
        qtySold:  z.number().int().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate qtySold doesn't exceed qtyBaked
      if (input.qtySold > input.qtyBaked) {
        throw new Error("qtySold cannot exceed qtyBaked");
      }

      // Fetch the recipe with its BOM to calculate ingredient consumption
      const recipe = await ctx.prisma.recipe.findFirst({
        where:   { id: input.recipeId },
        include: { ingredients: true },
      });
      if (!recipe) throw new Error("Product not found");

      // How many batches were baked (qtyBaked / batchSize)
      const batchesBaked = input.qtyBaked / recipe.batchSize;

      // Create the waste log entry
      const wasteLog = await ctx.prisma.wasteLog.create({
        data: {
          tenantId: input.tenantId,
          recipeId: input.recipeId,
          date:     new Date(input.date),
          qtyBaked: input.qtyBaked,
          qtySold:  input.qtySold,
        },
      });

      // Decrement ingredient stock for everything that was baked (not just sold)
      // We consumed ingredients when we baked, regardless of how many sold
      for (const line of recipe.ingredients) {
        const consumed = line.quantity * batchesBaked;
        await ctx.prisma.ingredient.update({
          where: { id: line.ingredientId },
          data:  { currentStock: { decrement: consumed } },
        });
      }

      return wasteLog;
    }),

  // Fetch end-of-day logs for the last N days, newest first
  getRecent: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(7) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return ctx.prisma.wasteLog.findMany({
        where:   { tenantId: input.tenantId, date: { gte: since } },
        include: { recipe: true }, // For product name display
        orderBy: { date: "desc" },
      });
    }),

  // Aggregate waste (qtyBaked - qtySold) by product over N days, sorted by waste desc
  getSummary: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const logs = await ctx.prisma.wasteLog.findMany({
        where:   { tenantId: input.tenantId, date: { gte: since } },
        include: { recipe: true },
      });

      // Group by product and accumulate baked/sold/wasted totals
      const byProduct = new Map<string, {
        productName: string;
        totalBaked:  number;
        totalSold:   number;
        totalWasted: number;
        days:        number;
      }>();

      for (const log of logs) {
        const wasted   = log.qtyBaked - log.qtySold;
        const existing = byProduct.get(log.recipeId);
        if (existing) {
          existing.totalBaked  += log.qtyBaked;
          existing.totalSold   += log.qtySold;
          existing.totalWasted += wasted;
          existing.days++;
        } else {
          byProduct.set(log.recipeId, {
            productName: log.recipe.name,
            totalBaked:  log.qtyBaked,
            totalSold:   log.qtySold,
            totalWasted: wasted,
            days: 1,
          });
        }
      }

      // Sort by most wasted descending
      return Array.from(byProduct.values()).sort((a, b) => b.totalWasted - a.totalWasted);
    }),
});
