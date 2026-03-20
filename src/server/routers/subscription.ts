import { router, protectedProcedure } from "../trpc";

export const subscriptionRouter = router({
  getMyTier: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user!.id!;

    const sub = await ctx.prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, status: true, currentPeriodEnd: true },
    });

    // No row means they pre-date the subscriptions table — treat as FREE.
    if (!sub) {
      return { tier: "FREE" as const, status: "ACTIVE" as const, currentPeriodEnd: null };
    }

    // past_due / canceled downgrades effective access to FREE
    const effectiveTier =
      sub.status === "CANCELED" || sub.status === "PAST_DUE" ? ("FREE" as const) : sub.tier;

    return { tier: effectiveTier, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd };
  }),
});
