import { router, protectedProcedure } from "../trpc";

export const subscriptionRouter = router({
  getMyTier: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user!.id!;
    const now    = new Date();

    const sub = await ctx.prisma.subscription.findUnique({
      where:  { userId },
      select: { tier: true, status: true, currentPeriodEnd: true, trialEndsAt: true },
    });

    // No row → pre-dates the subscriptions table OR createUser event missed.
    // Auto-create a 6-week trial so existing users get full access.
    if (!sub) {
      const TRIAL_MS  = 42 * 24 * 60 * 60 * 1000;
      const trialEndsAt = new Date(Date.now() + TRIAL_MS);
      await ctx.prisma.subscription.create({
        data: {
          userId,
          tier:         "FREE",
          status:       "TRIALING",
          trialEndsAt,
        },
      });
      return {
        tier:             "BAKER" as const,
        status:           "TRIALING" as const,
        currentPeriodEnd: null,
        isTrialing:       true,
        trialDaysLeft:    42,
        trialEndsAt,
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
