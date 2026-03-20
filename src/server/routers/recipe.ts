// Recipe (Product) tRPC router — CRUD for baked products + BOM ingredient lines
// "Recipe" in code = "Product" in the UI (what the bakery bakes and sells)
// BOM = Bill of Materials: which ingredients and how much per batch

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const recipeRouter = router({
  // List all active products with their ingredient BOM
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.recipe.findMany({
        where:   { tenantId: input.tenantId, active: true },
        include: { ingredients: { include: { ingredient: true } } },
        orderBy: { name: "asc" },
      });
    }),

  // Fetch a single product with BOM (includes inactive for detail page access)
  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findFirst({
        where:   { id: input.id, tenantId: input.tenantId },
        include: { ingredients: { include: { ingredient: true } } },
      });
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
      return recipe;
    }),

  // Create a product with its BOM lines in one operation
  create: protectedProcedure
    .input(
      z.object({
        tenantId:    z.string(),
        name:        z.string().min(1),
        description: z.string().optional(),
        batchSize:   z.number().int().min(1).default(1), // Units produced per batch
        ingredients: z.array(
          z.object({
            ingredientId: z.string(),
            quantity:     z.number().min(0), // Amount per batch
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { ingredients, ...recipeData } = input;
      return ctx.prisma.recipe.create({
        data: {
          ...recipeData,
          ingredients: { create: ingredients },
        },
        include: { ingredients: { include: { ingredient: true } } },
      });
    }),

  // Update product fields and optionally replace the entire BOM
  // "Replace all" strategy: delete existing lines, create new ones
  update: protectedProcedure
    .input(
      z.object({
        id:          z.string(),
        tenantId:    z.string(),
        name:        z.string().min(1).optional(),
        description: z.string().optional(),
        batchSize:   z.number().int().min(1).optional(),
        ingredients: z
          .array(
            z.object({
              ingredientId: z.string(),
              quantity:     z.number().min(0),
            })
          )
          .optional(), // undefined = don't touch the BOM
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ingredients, ...data } = input;

      if (ingredients !== undefined) {
        // Replace all: wipe existing BOM lines then create the new set
        await ctx.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
        return ctx.prisma.recipe.update({
          where: { id, tenantId },
          data: { ...data, ingredients: { create: ingredients } },
          include: { ingredients: { include: { ingredient: true } } },
        });
      }

      return ctx.prisma.recipe.update({
        where: { id, tenantId },
        data,
        include: { ingredients: { include: { ingredient: true } } },
      });
    }),

  // Soft-delete — preserves WasteLog references for historical demand data
  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.recipe.update({
        where: { id: input.id, tenantId: input.tenantId },
        data:  { active: false },
      });
    }),
});
