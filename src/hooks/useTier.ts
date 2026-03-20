"use client";

import { trpc } from "@/lib/trpc";

// ─── Tier limits config ───────────────────────────────────────────────────────
// Single source of truth. Update here when plan features change.

export type Tier = "FREE" | "COTTAGE" | "BAKER" | "ARTISAN";

interface TierConfig {
  recipeLimit: number | null;      // null = unlimited
  ingredientLimit: number | null;
  marketLimit: number | null;
  hasForecast: boolean;            // Bake Plan access
  hasExports: boolean;             // CSV + PDF export
  hasWaste: boolean;               // waste logging
  hasCogs: boolean;                // COGS per recipe
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    recipeLimit: 3,
    ingredientLimit: 3,
    marketLimit: 1,
    hasForecast: false,
    hasExports: false,
    hasWaste: false,
    hasCogs: false,
  },
  COTTAGE: {
    recipeLimit: 10,
    ingredientLimit: 25,
    marketLimit: 1,
    hasForecast: true,
    hasExports: false,
    hasWaste: true,
    hasCogs: true,
  },
  BAKER: {
    recipeLimit: null,
    ingredientLimit: null,
    marketLimit: 3,
    hasForecast: true,
    hasExports: true,
    hasWaste: true,
    hasCogs: true,
  },
  ARTISAN: {
    recipeLimit: null,
    ingredientLimit: null,
    marketLimit: null,
    hasForecast: true,
    hasExports: true,
    hasWaste: true,
    hasCogs: true,
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TierHelpers extends TierConfig {
  tier: Tier;
  isLoading: boolean;
  canAddRecipe: (currentCount: number) => boolean;
  canAddIngredient: (currentCount: number) => boolean;
}

export function useTier(): TierHelpers {
  const { data, isLoading } = trpc.subscription.getMyTier.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min — tier doesn't change mid-session
  });

  const tier: Tier = data?.tier ?? "FREE";
  const config = TIER_CONFIG[tier];

  return {
    tier,
    isLoading,
    ...config,
    canAddRecipe: (currentCount: number) =>
      config.recipeLimit === null || currentCount < config.recipeLimit,
    canAddIngredient: (currentCount: number) =>
      config.ingredientLimit === null || currentCount < config.ingredientLimit,
  };
}
