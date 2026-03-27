import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

const TRIAL_MS = 42 * 24 * 60 * 60 * 1000; // 6 weeks

export const subscriptionRouter = router({
  getMyTier: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user!.id!;
    const now    = new Date();

    const sub = await ctx.prisma.subscription.findUnique({
      where:  { userId },
      select: { tier: true, status: true, currentPeriodEnd: true, trialEndsAt: true },
    });

    // No row → user pre-dates the subscription system and hasn't started a trial yet.
    // Return FREE with a flag so the UI can offer them an explicit "Start free trial" CTA.
    if (!sub) {
      return {
        tier:             "FREE" as const,
        status:           "NONE" as const,
        currentPeriodEnd: null,
        isTrialing:       false,
        trialDaysLeft:    0,
        trialEndsAt:      null,
        canStartTrial:    true,   // signals UI to show the trial prompt
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
      canStartTrial:    false,
    };
  }),

  // ── Explicit trial activation ─────────────────────────────────────────────
  // Called when a user consciously clicks "Start my free trial".
  // Only works if they have no existing subscription row.
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user!.id!;

    const existing = await ctx.prisma.subscription.findUnique({
      where:  { userId },
      select: { status: true },
    });

    if (existing) {
      throw new TRPCError({
        code:    "BAD_REQUEST",
        message: "A subscription already exists for this account.",
      });
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_MS);
    await ctx.prisma.subscription.create({
      data: {
        userId,
        tier:      "FREE",
        status:    "TRIALING",
        trialEndsAt,
      },
    });

    return { trialEndsAt };
  }),
});
