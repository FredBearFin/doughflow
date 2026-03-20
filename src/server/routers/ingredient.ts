import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const UNIT_ENUM = ["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH", "GRAM", "KILOGRAM", "MILLILITER", "LITER"] as const;

export const ingredientRouter = router({
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.findMany({
        where:   { tenantId: input.tenantId, active: true },
        include: { supplier: true },
        orderBy: { name: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ingredient = await ctx.prisma.ingredient.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!ingredient) throw new TRPCError({ code: "NOT_FOUND" });
      return ingredient;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tenantId:     z.string(),
        name:         z.string().min(1),
        unit:         z.enum(UNIT_ENUM),
        currentStock: z.number().min(0).default(0),
        reorderPoint: z.number().min(0).default(0),
        costPerUnit:  z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id:           z.string(),
        tenantId:     z.string(),
        name:         z.string().min(1).optional(),
        unit:         z.enum(UNIT_ENUM).optional(),
        reorderPoint: z.number().min(0).optional(),
        costPerUnit:  z.number().min(0).optional(),
        active:       z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ...data } = input;
      return ctx.prisma.ingredient.update({ where: { id, tenantId }, data });
    }),

  adjust: protectedProcedure
    .input(
      z.object({
        ingredientId: z.string(),
        tenantId:     z.string(),
        qty:          z.number(),
        reason:       z.enum(["ADJUSTMENT", "OPENING"]).optional(),
        note:         z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.update({
        where: { id: input.ingredientId },
        data:  { currentStock: { increment: input.qty } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.update({
        where: { id: input.id, tenantId: input.tenantId },
        data:  { active: false },
      });
    }),
});
