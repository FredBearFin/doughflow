/**
 * Pantry (ingredient list) page — /pantry
 *
 * Displays all active ingredients as a responsive card grid. Features:
 *   - Summary chips at the top showing how many items are at "critical" or "low"
 *     stock levels so staff can act immediately without scanning the whole list
 *   - A search bar that filters ingredients by name (client-side, instant)
 *   - An "Add Ingredient" button that opens the creation dialog
 *   - Each ingredient is rendered as an IngredientCard (stock level bar, badge, cost)
 *
 * Stock severity thresholds:
 *   critical — currentStock <= reorderPoint × 0.5 (less than half the reorder threshold)
 *   low      — currentStock <= reorderPoint (at or below the reorder threshold)
 *
 * The page is a Client Component because it has interactive state (search,
 * dialog open/close) and reads session data via useTenantId.
 */

"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { IngredientCard } from "@/components/pantry/IngredientCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { Plus, Search } from "lucide-react";
import { IngredientFormDialog } from "@/components/pantry/IngredientFormDialog";
import { useTier } from "@/hooks/useTier";
import { UpgradeModal } from "@/components/UpgradeModal";

const TIER_LABEL: Record<string, string> = {
  FREE: "Free",
  PAID: "Pro",
};

/**
 * PantryPage is the default export for the /pantry route.
 * It manages search state, fetches all ingredients, and conditionally renders
 * the ingredient grid or empty/loading states.
 */
export default function PantryPage() {
  const tenantId = useTenantId();
  const tier = useTier();

  /** Controlled search input value — filters the ingredient list by name */
  const [search, setSearch] = useState("");

  /** Whether the "Add Ingredient" dialog is open */
  const [showCreate, setShowCreate] = useState(false);

  /** Whether the upgrade modal is shown (ingredient limit hit) */
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Fetch all active ingredients for this tenant, sorted alphabetically
  const { data: ingredients, isLoading } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  /**
   * Client-side search filter — case-insensitive substring match on ingredient name.
   * Applied on top of the full list returned from the server so no extra API call
   * is needed as the user types.
   */
  const filtered = ingredients?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  /** Total ingredient count (before search filter, so the limit check is accurate) */
  const ingredientCount = ingredients?.length ?? 0;

  /** True once we know for sure the user is at or over their ingredient limit */
  const atIngredientLimit = !tier.isLoading && !tier.canAddIngredient(ingredientCount);

  /** Open the create dialog, or fire the upgrade modal if the limit is hit */
  function handleAddIngredient() {
    if (atIngredientLimit) {
      setShowUpgrade(true);
    } else {
      setShowCreate(true);
    }
  }

  /**
   * Critical count: items at 50% or less of their reorder point.
   * Items with reorderPoint === 0 are excluded (no threshold set yet).
   */
  const criticalCount = filtered?.filter((i) => i.currentStock <= i.reorderPoint * 0.5 && i.reorderPoint > 0).length ?? 0;

  /**
   * Low count: items between 50% and 100% of their reorder point.
   * These are approaching critical but not yet there.
   */
  const lowCount = filtered?.filter((i) => i.currentStock <= i.reorderPoint && i.currentStock > i.reorderPoint * 0.5 && i.reorderPoint > 0).length ?? 0;

  return (
    <div>
      <TopBar title="Pantry">
        <Button onClick={handleAddIngredient}>
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </TopBar>

      {/* Soft limit banner — shown when approaching or at the ingredient cap */}
      {!tier.isLoading && tier.ingredientLimit !== null && (
        <div
          className={`mx-6 mt-4 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between ${
            atIngredientLimit
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : ingredientCount >= tier.ingredientLimit - 2
              ? "bg-stone-50 border border-stone-200 text-stone-500"
              : "hidden"
          }`}
        >
          <span>
            {atIngredientLimit
              ? `You've used all ${tier.ingredientLimit} ingredient slots on the ${TIER_LABEL[tier.tier] ?? tier.tier} plan.`
              : `${tier.ingredientLimit - ingredientCount} ingredient slot${tier.ingredientLimit - ingredientCount === 1 ? "" : "s"} remaining on the ${TIER_LABEL[tier.tier] ?? tier.tier} plan.`}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="ml-4 text-amber-600 font-medium hover:underline whitespace-nowrap"
          >
            Upgrade →
          </button>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/*
         * Summary chips — shown only when there are items in critical or low state.
         * They give immediate situational awareness without requiring a scroll.
         */}
        {(criticalCount > 0 || lowCount > 0) && (
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                {/* Red dot indicator */}
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {criticalCount} critical
              </span>
            )}
            {lowCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                {/* Amber dot indicator */}
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {lowCount} low
              </span>
            )}
          </div>
        )}

        {/* Search bar with an icon inset to the left of the input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          {/* pl-9 adds left padding to clear the search icon */}
          <Input
            placeholder="Search ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Ingredient card grid — responsive: 1 col → 2 → 3 → 4 columns */}
        {isLoading ? (
          // Pulse skeleton placeholders while data loads
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          // Empty state — shown when there are no ingredients yet or no search match
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-stone-400 text-lg mb-4">No ingredients yet</p>
            <Button onClick={handleAddIngredient}>
              <Plus className="h-4 w-4" />
              Add your first ingredient
            </Button>
          </div>
        ) : (
          // Ingredient cards — each card links to the ingredient detail page
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered?.map((ing) => (
              <IngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        )}
      </div>

      {/* Add Ingredient dialog — rendered outside the grid to avoid stacking context issues */}
      {tenantId && (
        <IngredientFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}

      {/* Upgrade modal — fires when ingredient limit is hit */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        title="Ingredient limit reached"
        limitLine={`${TIER_LABEL[tier.tier] ?? tier.tier} accounts can track up to ${tier.ingredientLimit} ingredients.`}
        unlockLine="Upgrade to Pro for unlimited ingredients, Bake Plan forecasts, waste logging, analytics, and more — just $9/mo."
        ctaLabel="Upgrade to Pro — $9/mo"
      />
    </div>
  );
}
