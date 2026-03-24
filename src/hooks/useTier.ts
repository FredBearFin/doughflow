"use client";

import { trpc } from "@/lib/trpc";

// ─── Tier definition ──────────────────────────────────────────────────────────
// Two tiers only: Free (limited trial) and Paid (everything unlocked).
//
// The DB still stores the legacy enum values (FREE/COTTAGE/BAKER/ARTISAN) so
// no migration is required.  Any non-FREE DB value maps to PAID here, meaning
// existing Cottage/Baker subscribers automatically get full access.

export type Tier = "FREE" | "PAID";

// Internal DB enum — matches Prisma SubscriptionTier values
type DbTier = "FREE" | "COTTAGE" | "BAKER" | "ARTISAN";

/** Map any DB tier value to the two-tier public model. */
function toTier(db: DbTier): Tier {
  return db === "FREE" ? "FREE" : "PAID";
}

interface TierConfig {
  recipeLimit:         number | null;   // null = unlimited
  ingredientLimit:     number | null;
  marketLimit:         number | null;
  hasForecast:         boolean;         // Bake Plan access
  hasCsvExport:        boolean;
  hasPdfExport:        boolean;
  hasWaste:            boolean;         // End-of-day waste logging
  hasCogs:             boolean;         // COGS per recipe
  hasAnalytics:        boolean;         // Waste analytics charts + KPI cards
  hasSuggestedPricing: boolean;         // Quick Flip pricing calculator
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    recipeLimit:         3,
    ingredientLimit:     3,
    marketLimit:         1,
    hasForecast:         false,
    hasCsvExport:        false,
    hasPdfExport:        false,
    hasWaste:            false,
    hasCogs:             false,
    hasAnalytics:        false,
    hasSuggestedPricing: false,
  },
  PAID: {
    recipeLimit:         null,
    ingredientLimit:     null,
    marketLimit:         null,
    hasForecast:         true,
    hasCsvExport:        true,
    hasPdfExport:        true,
    hasWaste:            true,
    hasCogs:             true,
    hasAnalytics:        true,
    hasSuggestedPricing: true,
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TierHelpers extends TierConfig {
  tier:             Tier;
  isTrialing:       boolean;   // true while the 6-week free trial is active
  trialDaysLeft:    number;    // 0 when not trialing
  isLoading:        boolean;
  canAddRecipe:     (currentCount: number) => boolean;
  canAddIngredient: (currentCount: number) => boolean;
}

export function useTier(): TierHelpers {
  const { data, isLoading } = trpc.subscription.getMyTier.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min — tier doesn't change mid-session
  });

  const tier          = toTier((data?.tier ?? "FREE") as DbTier);
  const isTrialing    = data?.isTrialing   ?? false;
  const trialDaysLeft = data?.trialDaysLeft ?? 0;
  const config        = TIER_CONFIG[tier];

  return {
    tier,
    isTrialing,
    trialDaysLeft,
    isLoading,
    ...config,
    canAddRecipe:     (n) => config.recipeLimit     === null || n < config.recipeLimit,
    canAddIngredient: (n) => config.ingredientLimit === null || n < config.ingredientLimit,
  };
}
