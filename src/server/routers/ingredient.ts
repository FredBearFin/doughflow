import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const ingredientRouter = router({
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.findMany({
        where: { tenantId: input.tenantId },
        include: { supplier: true },
        orderBy: { name: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ingredient = await ctx.prisma.ingredient.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
        include: {
          supplier: true,
          ledgerEntries: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      });
      if (!ingredient) throw new TRPCError({ code: "NOT_FOUND" });
      return ingredient;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        name: z.string().min(1),
        sku: z.string().optional(),
        unit: z.enum(["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH", "GRAM", "KILOGRAM", "MILLILITER", "LITER"]),
        currentStock: z.number().min(0).default(0),
        reorderPoint: z.number().min(0).default(0),
        reorderQty: z.number().min(0).default(0),
        leadTimeDays: z.number().int().min(0).default(3),
        costPerUnit: z.number().min(0).default(0),
        shelfLifeDays: z.number().int().optional(),
        supplierId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { tenantId, currentStock, ...rest } = input;
      const ingredient = await ctx.prisma.ingredient.create({
        data: { tenantId, currentStock, ...rest },
      });

      // Create opening ledger entry if stock > 0
      if (currentStock > 0) {
        await ctx.prisma.inventoryLedger.create({
          data: {
            tenantId,
            ingredientId: ingredient.id,
            qty: currentStock,
            reason: "OPENING",
            note: "Opening stock",
          },
        });
      }

      return ingredient;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        name: z.string().min(1).optional(),
        sku: z.string().optional(),
        unit: z.enum(["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH", "GRAM", "KILOGRAM", "MILLILITER", "LITER"]).optional(),
        reorderPoint: z.number().min(0).optional(),
        reorderQty: z.number().min(0).optional(),
        leadTimeDays: z.number().int().min(0).optional(),
        costPerUnit: z.number().min(0).optional(),
        shelfLifeDays: z.number().int().optional(),
        supplierId: z.string().nullable().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ...data } = input;
      return ctx.prisma.ingredient.update({
        where: { id, tenantId },
        data,
      });
    }),

  adjust: protectedProcedure
    .input(
      z.object({
        ingredientId: z.string(),
        tenantId: z.string(),
        qty: z.number(),
        reason: z.enum(["ADJUSTMENT", "OPENING"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [ingredient] = await ctx.prisma.$transaction([
        ctx.prisma.ingredient.update({
          where: { id: input.ingredientId },
          data: { currentStock: { increment: input.qty } },
        }),
        ctx.prisma.inventoryLedger.create({
          data: {
            tenantId: input.tenantId,
            ingredientId: input.ingredientId,
            qty: input.qty,
            reason: input.reason,
            note: input.note,
          },
        }),
      ]);
      return ingredient;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.ingredient.update({
        where: { id: input.id, tenantId: input.tenantId },
        data: { active: false },
      });
    }),
});
