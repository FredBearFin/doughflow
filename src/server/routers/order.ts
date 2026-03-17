import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { explodeBOM } from "@/lib/bom";

export const orderRouter = router({
  getAll: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.purchaseOrder.findMany({
        where: { tenantId: input.tenantId },
        include: {
          supplier: true,
          lines: { include: { ingredient: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await ctx.prisma.purchaseOrder.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
        include: {
          supplier: true,
          lines: { include: { ingredient: true } },
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        supplierId: z.string(),
        expectedAt: z.string().optional(),
        notes: z.string().optional(),
        lines: z.array(
          z.object({
            ingredientId: z.string(),
            qty: z.number().min(0.01),
            unitCost: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const totalCost = input.lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);

      return ctx.prisma.purchaseOrder.create({
        data: {
          tenantId: input.tenantId,
          supplierId: input.supplierId,
          expectedAt: input.expectedAt ? new Date(input.expectedAt) : undefined,
          notes: input.notes,
          totalCost,
          lines: { create: input.lines },
        },
        include: { supplier: true, lines: { include: { ingredient: true } } },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        status: z.enum(["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.purchaseOrder.update({
        where: { id: input.id, tenantId: input.tenantId },
        data: {
          status: input.status,
          sentAt: input.status === "SENT" ? new Date() : undefined,
          receivedAt: input.status === "RECEIVED" ? new Date() : undefined,
        },
      });
    }),

  receive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        lines: z.array(
          z.object({
            lineId: z.string(),
            ingredientId: z.string(),
            receivedQty: z.number().min(0),
            unitCost: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ops = input.lines.flatMap((line) => [
        ctx.prisma.purchaseOrderLine.update({
          where: { id: line.lineId },
          data: { receivedQty: line.receivedQty, unitCost: line.unitCost },
        }),
        ctx.prisma.ingredient.update({
          where: { id: line.ingredientId },
          data: {
            currentStock: { increment: line.receivedQty },
            costPerUnit: line.unitCost,
          },
        }),
        ctx.prisma.inventoryLedger.create({
          data: {
            tenantId: input.tenantId,
            ingredientId: line.ingredientId,
            qty: line.receivedQty,
            reason: "PURCHASE",
            refId: input.id,
          },
        }),
      ]);

      await ctx.prisma.$transaction([
        ...ops,
        ctx.prisma.purchaseOrder.update({
          where: { id: input.id },
          data: { status: "RECEIVED", receivedAt: new Date() },
        }),
      ]);

      return ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.id },
        include: { supplier: true, lines: { include: { ingredient: true } } },
      });
    }),

  recordSale: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        recipeId: z.string(),
        qty: z.number().int().min(1),
        revenue: z.number().min(0),
        source: z.string().default("MANUAL"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findFirst({
        where: { id: input.recipeId, tenantId: input.tenantId },
        include: { ingredients: { include: { ingredient: true } } },
      });
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });

      const consumption = explodeBOM(recipe, input.qty);

      const sale = await ctx.prisma.sale.create({
        data: {
          tenantId: input.tenantId,
          recipeId: input.recipeId,
          qty: input.qty,
          revenue: input.revenue,
          source: input.source,
        },
      });

      const ledgerOps = Array.from(consumption.entries()).map(([ingredientId, qty]) =>
        ctx.prisma.$transaction([
          ctx.prisma.ingredient.update({
            where: { id: ingredientId },
            data: { currentStock: { decrement: qty } },
          }),
          ctx.prisma.inventoryLedger.create({
            data: {
              tenantId: input.tenantId,
              ingredientId,
              qty: -qty,
              reason: "PRODUCTION",
              refId: sale.id,
            },
          }),
        ])
      );

      await Promise.all(ledgerOps);
      return sale;
    }),
});
