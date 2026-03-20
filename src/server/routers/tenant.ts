import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const tenantRouter = router({
  get: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } });
    }),

  update: protectedProcedure
    .input(z.object({ tenantId: z.string(), name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { name: input.name },
      });
    }),
});
