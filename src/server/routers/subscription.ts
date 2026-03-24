import { router, protectedProcedure } from "../trpc";

export const subscriptionRouter = router({
  getMyTier: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user!.id!;
    const now    = new Date();

    const sub = await ctx.prisma.subscription.findUnique({
      where:  { userId },
      select: { tier: true, status: true, currentPeriodEnd: true, trialEndsAt: true },
    });

    // No row → pre-dates the subscriptions table, treat as FREE (no trial)
    if (!sub) {
      return {
        tier:          "FREE" as const,
        status:        "ACTIVE" as const,
        currentPeriodEnd: null,
        isTrialing:    false,
        trialDaysLeft: 0,
        trialEndsAt:   null,
      };
    }

    // ── Trial logic ───────────────────────────────────────────────────────────
    // TRIALING + trialEndsAt in the future → full Pro access
    // TRIALING + trialEndsAt in the past   → trial expired, downgrade to FREE
    const isActivelyTrialing =
      sub.status === "TRIALING" &&
      sub.trialEndsAt !== null &&
      sub.trialEndsAt > now;

    const trialDaysLeft = isActivelyTrialing
      ? Math.ceil((sub.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // ── Effective tier ────────────────────────────────────────────────────────
    // Precedence: active trial > paid active > everything else → FREE
    let effectiveTier: typeof sub.tier | "FREE";
    if (isActivelyTrialing) {
      effectiveTier = "BAKER"; // BAKER = the "paid" DB value, gives full access
    } else if (sub.status === "CANCELED" || sub.status === "PAST_DUE") {
      effectiveTier = "FREE";
    } else if (sub.status === "TRIALING") {
      // Trial row exists but has expired
      effectiveTier = "FREE";
    } else {
      effectiveTier = sub.tier;
    }

    return {
      tier:             effectiveTier,
      status:           sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      isTrialing:       isActivelyTrialing,
      trialDaysLeft,
      trialEndsAt:      sub.trialEndsAt,
    };
  }),
});
