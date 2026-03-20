/**
 * Tenant tRPC router — bakery account management.
 *
 * Procedures:
 *   get    — fetch the current tenant's public info (name, slug, plan)
 *   update — update the bakery name
 *
 * Used by the /settings page so bakers can rename their bakery account.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const tenantRouter = router({
  /**
   * Get the current tenant's info.
   * Returns name, slug, and plan — used to pre-fill the settings form
   * and display account details.
   */
  get: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.tenant.findFirst({
        where:  { id: input.tenantId },
        select: { id: true, name: true, slug: true, plan: true },
      });
    }),

  /**
   * Update the bakery display name.
   * Does not affect the slug (URL-safe identifier) — only the human-readable name.
   */
  update: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        name:     z.string().min(1, "Bakery name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data:  { name: input.name },
        select: { id: true, name: true, slug: true, plan: true },
      });
    }),
});
