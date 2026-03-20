"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { useTier } from "@/hooks/useTier";
import { formatCurrency } from "@/lib/utils";
import { calculateRecipeCOGS } from "@/lib/cogs";
import { Plus, UtensilsCrossed, Lock } from "lucide-react";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function RecipesPage() {
  const tenantId = useTenantId();
  const tier = useTier();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: recipes, isLoading } = trpc.recipe.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const recipeCount = recipes?.length ?? 0;
  const atLimit = !tier.isLoading && !tier.canAddRecipe(recipeCount);

  function handleNewRecipe() {
    if (atLimit) {
      setShowUpgrade(true);
    } else {
      setShowCreate(true);
    }
  }

  // Label shown on the button when at limit so it's clear why the lock is there
  const addButtonLabel = atLimit
    ? `Limit reached (${tier.recipeLimit}/${tier.recipeLimit})`
    : "New Recipe";

  return (
    <div>
      <TopBar title="Recipes">
        <Button onClick={handleNewRecipe} variant={atLimit ? "outline" : "default"}>
          {atLimit ? (
            <Lock className="h-4 w-4 text-stone-400" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {addButtonLabel}
        </Button>
      </TopBar>

      {/* Soft limit banner — shows how many slots remain */}
      {!tier.isLoading && tier.recipeLimit !== null && (
        <div
          className={`mx-6 mt-4 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between ${
            atLimit
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : recipeCount >= tier.recipeLimit - 1
              ? "bg-stone-50 border border-stone-200 text-stone-500"
              : "hidden"
          }`}
        >
          <span>
            {atLimit
              ? `You've used all ${tier.recipeLimit} recipe slots on the Free plan.`
              : `${tier.recipeLimit - recipeCount} recipe slot${tier.recipeLimit - recipeCount === 1 ? "" : "s"} remaining on the Free plan.`}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="ml-4 text-amber-600 font-medium hover:underline whitespace-nowrap"
          >
            Upgrade →
          </button>
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : recipes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UtensilsCrossed className="h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-400 text-lg mb-4">No recipes yet</p>
            <Button onClick={handleNewRecipe}>
              <Plus className="h-4 w-4" />
              Create your first recipe
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map((recipe) => {
              const cogs = calculateRecipeCOGS(recipe);
              return (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-stone-900 mb-1">{recipe.name}</h3>
                      {recipe.description && (
                        <p className="text-sm text-stone-400 mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex justify-between items-end text-sm mt-3">
                        <div>
                          <p className="text-stone-400">COGS</p>
                          <p className="tabular-nums font-semibold text-stone-900">
                            {formatCurrency(cogs.totalCost)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-stone-400">Margin</p>
                          <p
                            className={`tabular-nums font-semibold ${
                              cogs.grossMargin >= 60
                                ? "text-green-600"
                                : cogs.grossMargin >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {cogs.grossMargin.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-stone-400">Price</p>
                          <p className="tabular-nums font-semibold text-stone-900">
                            {formatCurrency(recipe.sellingPrice)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        {recipe.ingredients.length} ingredients · batch of {recipe.batchSize}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe form — only mounts when allowed */}
      {tenantId && (
        <RecipeFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}

      {/* Upgrade modal — fires when limit is hit */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        title="Recipe limit reached"
        limitLine={`Free accounts can track up to ${tier.recipeLimit ?? 3} recipes.`}
        unlockLine="Upgrade to Cottage for up to 10 recipes, Bake Plan forecasts, full cost tracking, and more — just $6/mo."
        ctaLabel="Upgrade to Cottage — $6/mo"
      />
    </div>
  );
}
