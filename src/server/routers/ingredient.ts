// Ingredient tRPC router — pantry CRUD + stock adjustments
// All procedures require authentication and are scoped to tenantId

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const UNIT_ENUM = ["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH", "GRAM", "KILOGRAM", "MILLILITER", "LITER"] as const;

export const ingredientRouter = router({
  // Return all active ingredients for a tenant, sorted alphabetically
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.findMany({
        where: { tenantId: input.tenantId, active: true },
        orderBy: { name: "asc" },
      });
    }),

  // Fetch a single ingredient — throws NOT_FOUND if it doesn't exist for this tenant
  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ingredient = await ctx.prisma.ingredient.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!ingredient) throw new TRPCError({ code: "NOT_FOUND" });
      return ingredient;
    }),

  // Create a new ingredient
  create: protectedProcedure
    .input(
      z.object({
        tenantId:       z.string(),
        name:           z.string().min(1),
        unit:           z.enum(UNIT_ENUM),
        currentStock:   z.number().min(0).default(0),
        reorderPoint:   z.number().min(0).default(0),
        costPerUnit:    z.number().min(0).optional(),
        wholeUnitsOnly: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.create({ data: input });
    }),

  // Update ingredient metadata — currentStock excluded (use adjust instead)
  update: protectedProcedure
    .input(
      z.object({
        id:             z.string(),
        tenantId:       z.string(),
        name:           z.string().min(1).optional(),
        unit:           z.enum(UNIT_ENUM).optional(),
        reorderPoint:   z.number().min(0).optional(),
        costPerUnit:    z.number().min(0).nullable().optional(),
        wholeUnitsOnly: z.boolean().optional(),
        active:         z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ...data } = input;
      return ctx.prisma.ingredient.update({ where: { id, tenantId }, data });
    }),

  // Adjust stock level (qty is signed: positive = add, negative = remove)
  // Stock is floored at 0 — cannot go negative.
  adjust: protectedProcedure
    .input(
      z.object({
        ingredientId: z.string(),
        tenantId:     z.string(),
        qty:          z.number(), // signed
        note:         z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const current = await ctx.prisma.ingredient.findUnique({
        where:  { id: input.ingredientId },
        select: { currentStock: true },
      });
      const newStock = Math.max(0, (current?.currentStock ?? 0) + input.qty);
      return ctx.prisma.ingredient.update({
        where: { id: input.ingredientId },
        data:  { currentStock: newStock },
      });
    }),

  // Soft-delete — preserves BOM references and historical data
  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.update({
        where: { id: input.id, tenantId: input.tenantId },
        data:  { active: false },
      });
    }),
});
