import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const recipeRouter = router({
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.recipe.findMany({
        where: { tenantId: input.tenantId, active: true },
        include: {
          ingredients: { include: { ingredient: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
        include: { ingredients: { include: { ingredient: true } } },
      });
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
      return recipe;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        batchSize: z.number().int().min(1).default(1),
        yieldPct: z.number().min(0.01).max(1).default(0.95),
        sellingPrice: z.number().min(0).default(0),
        ingredients: z.array(
          z.object({
            ingredientId: z.string(),
            quantity: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { ingredients, ...recipeData } = input;
      return ctx.prisma.recipe.create({
        data: {
          ...recipeData,
          ingredients: {
            create: ingredients,
          },
        },
        include: { ingredients: { include: { ingredient: true } } },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        batchSize: z.number().int().min(1).optional(),
        yieldPct: z.number().min(0.01).max(1).optional(),
        sellingPrice: z.number().min(0).optional(),
        ingredients: z
          .array(
            z.object({
              ingredientId: z.string(),
              quantity: z.number().min(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, tenantId, ingredients, ...data } = input;

      if (ingredients !== undefined) {
        // Replace all ingredient lines
        await ctx.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
        return ctx.prisma.recipe.update({
          where: { id, tenantId },
          data: {
            ...data,
            ingredients: { create: ingredients },
          },
          include: { ingredients: { include: { ingredient: true } } },
        });
      }

      return ctx.prisma.recipe.update({
        where: { id, tenantId },
        data,
        include: { ingredients: { include: { ingredient: true } } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.recipe.update({
        where: { id: input.id, tenantId: input.tenantId },
        data: { active: false },
      });
    }),
});
