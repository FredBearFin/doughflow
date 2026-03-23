// ForecastEvent tRPC router
// Baker-configured event/promo multipliers for demand forecasting.
// e.g. Valentine's Day ×2.3, Saturday Farmers Market ×1.5
// Hard delete (intentional data — no soft-delete needed).

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const eventsRouter = router({
  // All tenant events, newest first, with product name included
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.forecastEvent.findMany({
        where:   { tenantId: input.tenantId },
        include: { recipe: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      });
    }),

  // Create a new event multiplier
  create: protectedProcedure
    .input(
      z.object({
        tenantId:       z.string(),
        name:           z.string().min(1, "Event name is required"),
        date:           z.string().min(1, "Date is required"), // "YYYY-MM-DD"
        multiplier:     z.number().min(0.1, "Must be at least 0.1×").max(20, "Max 20×"),
        recipeId:       z.string().optional(),
        repeatAnnually: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { date, recipeId, ...rest } = input;
      return ctx.prisma.forecastEvent.create({
        data: {
          ...rest,
          date:     new Date(date),
          recipeId: recipeId || null,
        },
      });
    }),

  // Update an existing event (ownership-checked)
  update: protectedProcedure
    .input(
      z.object({
        id:             z.string(),
        tenantId:       z.string(),
        name:           z.string().min(1).optional(),
        date:           z.string().optional(),
        multiplier:     z.number().min(0.1).max(20).optional(),
        recipeId:       z.string().nullable().optional(),
        repeatAnnually: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, date, recipeId, ...rest } = input;
      const existing = await ctx.prisma.forecastEvent.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.forecastEvent.update({
        where: { id },
        data:  {
          ...rest,
          ...(date     !== undefined ? { date: new Date(date) } : {}),
          ...(recipeId !== undefined ? { recipeId }             : {}),
        },
      });
    }),

  // Hard delete (events are intentional, no soft-delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.forecastEvent.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.forecastEvent.delete({ where: { id: input.id } });
    }),
});
