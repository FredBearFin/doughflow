import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const wasteRouter = router({
  log: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        ingredientId: z.string(),
        qty: z.number().min(0.01),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "unknown";

      const [wasteLog] = await ctx.prisma.$transaction([
        ctx.prisma.wasteLog.create({
          data: {
            tenantId: input.tenantId,
            ingredientId: input.ingredientId,
            qty: input.qty,
            reason: input.reason,
            loggedBy: userId,
          },
        }),
        ctx.prisma.ingredient.update({
          where: { id: input.ingredientId },
          data: { currentStock: { decrement: input.qty } },
        }),
        ctx.prisma.inventoryLedger.create({
          data: {
            tenantId: input.tenantId,
            ingredientId: input.ingredientId,
            qty: -input.qty,
            reason: "WASTE",
            note: input.reason,
          },
        }),
      ]);

      return wasteLog;
    }),

  getRecent: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(7) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return ctx.prisma.wasteLog.findMany({
        where: { tenantId: input.tenantId, createdAt: { gte: since } },
        include: { ingredient: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  getSummary: protectedProcedure
    .input(z.object({ tenantId: z.string(), days: z.number().int().default(7) }))
    .query(async ({ input, ctx }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const logs = await ctx.prisma.wasteLog.findMany({
        where: { tenantId: input.tenantId, createdAt: { gte: since } },
        include: { ingredient: true },
      });

      // Group by ingredient
      const byIngredient = new Map<
        string,
        { ingredient: (typeof logs)[0]["ingredient"]; totalQty: number; totalCost: number; count: number }
      >();

      for (const log of logs) {
        const key = log.ingredientId;
        const existing = byIngredient.get(key);
        const cost = log.qty * log.ingredient.costPerUnit;
        if (existing) {
          existing.totalQty += log.qty;
          existing.totalCost += cost;
          existing.count++;
        } else {
          byIngredient.set(key, {
            ingredient: log.ingredient,
            totalQty: log.qty,
            totalCost: cost,
            count: 1,
          });
        }
      }

      return Array.from(byIngredient.values()).sort((a, b) => b.totalCost - a.totalCost);
    }),
});
