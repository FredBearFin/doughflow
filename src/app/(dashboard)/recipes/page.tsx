"use client";

// Products page — /recipes (URL kept for simplicity, label shows "Products")
// Lists all baked products with their ingredient counts, batch size, and pricing summary.

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { useTier } from "@/hooks/useTier";
import { formatCurrency } from "@/lib/utils";
import { Plus, UtensilsCrossed, Pencil } from "lucide-react";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function RecipesPage() {
  const tenantId = useTenantId();
  const tier = useTier();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editRecipe, setEditRecipe] = useState<{
    id: string; name: string; description: string | null;
    batchSize: number; retailPrice: number | null; bomCostPerUnit: number | null;
  } | null>(null);

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

  return (
    <div>
      <TopBar title="Products">
        <Button onClick={handleNewRecipe}>
          <Plus className="h-4 w-4" />
          New Product
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
              ? `You've used all ${tier.recipeLimit} recipe slots on the free plan.`
              : `${tier.recipeLimit - recipeCount} recipe slot${tier.recipeLimit - recipeCount === 1 ? "" : "s"} remaining on the free plan.`}
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
              <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : recipes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UtensilsCrossed className="h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-400 text-lg mb-4">No products yet</p>
            <Button onClick={handleNewRecipe}>
              <Plus className="h-4 w-4" />
              Add your first product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map((recipe) => {
              const margin = recipe.retailPrice != null && recipe.bomCostPerUnit != null && recipe.retailPrice > 0
                ? ((recipe.retailPrice - recipe.bomCostPerUnit) / recipe.retailPrice) * 100
                : null;

              return (
                <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/recipes/${recipe.id}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-stone-900 hover:text-amber-700 transition-colors">
                          {recipe.name}
                        </h3>
                      </Link>
                      {/* Edit / Price button */}
                      <button
                        onClick={() => setEditRecipe({
                          id:            recipe.id,
                          name:          recipe.name,
                          description:   recipe.description,
                          batchSize:     recipe.batchSize,
                          retailPrice:   recipe.retailPrice,
                          bomCostPerUnit: recipe.bomCostPerUnit,
                        })}
                        className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit / Price"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>

                    {recipe.description && (
                      <p className="text-sm text-stone-400 mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    {/* Meta line: ingredients + batch size */}
                    <p className="text-sm text-stone-500">
                      {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
                      {" · "}batch of {recipe.batchSize}
                    </p>

                    {/* Pricing summary */}
                    <div className="mt-2">
                      {recipe.retailPrice != null && recipe.bomCostPerUnit != null ? (
                        <p className="text-sm">
                          <span className="text-stone-400">Cost </span>
                          <span className="font-medium text-stone-700">{formatCurrency(recipe.bomCostPerUnit)}</span>
                          <span className="text-stone-300 mx-1">·</span>
                          <span className="text-stone-400">Sell </span>
                          <span className="font-medium text-stone-700">{formatCurrency(recipe.retailPrice)}</span>
                          {/* Margin % is a Baker+ feature — only shown when hasSuggestedPricing */}
                          {margin !== null && tier.hasSuggestedPricing && (
                            <>
                              <span className="text-stone-300 mx-1">·</span>
                              <span className={`font-semibold ${margin >= 50 ? "text-green-600" : margin >= 30 ? "text-amber-600" : "text-red-600"}`}>
                                {margin.toFixed(0)}% margin
                              </span>
                            </>
                          )}
                        </p>
                      ) : recipe.retailPrice != null ? (
                        <p className="text-sm">
                          <span className="text-stone-400">Sell </span>
                          <span className="font-medium text-stone-700">{formatCurrency(recipe.retailPrice)}</span>
                          <span className="text-stone-400 ml-2 text-xs">
                            (set ingredient costs for margin)
                          </span>
                        </p>
                      ) : (
                        <button
                          onClick={() => setEditRecipe({
                            id:            recipe.id,
                            name:          recipe.name,
                            description:   recipe.description,
                            batchSize:     recipe.batchSize,
                            retailPrice:   recipe.retailPrice,
                            bomCostPerUnit: recipe.bomCostPerUnit,
                          })}
                          className="text-sm text-amber-600 hover:underline font-medium"
                        >
                          Set price →
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {tenantId && (
        <RecipeFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}

      {/* Edit / Price dialog */}
      {tenantId && editRecipe && (
        <RecipeFormDialog
          tenantId={tenantId}
          recipe={editRecipe}
          bomCostPerUnit={editRecipe.bomCostPerUnit}
          open={!!editRecipe}
          onOpenChange={(v) => { if (!v) setEditRecipe(null); }}
        />
      )}

      {/* Upgrade modal — fires when limit is hit */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        title="Recipe limit reached"
        limitLine={`Free accounts can track up to ${tier.recipeLimit ?? 3} recipes.`}
        unlockLine="Upgrade to Pro for unlimited recipes, Bake Plan forecasts, full cost tracking, and more — just $9/mo."
        ctaLabel="Upgrade to Pro — $9/mo"
      />
    </div>
  );
}
