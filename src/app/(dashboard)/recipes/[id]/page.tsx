/**
 * Product detail page — /recipes/[id]
 *
 * Shows everything about a single bakery product:
 *   - KPI cards: batch size and ingredient count
 *   - Bill of Materials (BOM) — every ingredient and the quantity needed per batch
 *   - An "Edit" button in the TopBar that opens RecipeFormDialog pre-populated
 *     with the current product values
 *
 * "Recipes" in the database = "Products" in the UI vocabulary.
 *
 * This is a Client Component ("use client") because dialog state is managed
 * locally and the tenantId hook reads client session data.
 */

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatUnit } from "@/types";
import { ArrowLeft, Pencil } from "lucide-react";

/**
 * RecipeDetailPage renders the full detail view for a single product.
 * The product ID is taken from the dynamic [id] URL segment.
 */
export default function RecipeDetailPage() {
  // Read the [id] param from the URL (e.g. /recipes/clxyz123)
  const { id } = useParams<{ id: string }>();
  const tenantId = useTenantId();

  /** Controls visibility of the product edit dialog */
  const [showEdit, setShowEdit] = useState(false);

  // Fetch the product with all ingredient BOM lines
  const { data: recipe, isLoading } = trpc.recipe.getById.useQuery(
    { id, tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Loading skeleton while data arrives
  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading…" />
        <div className="p-6">
          <div className="h-48 animate-pulse rounded-xl bg-stone-200" />
        </div>
      </div>
    );
  }

  // Guard: product not found
  if (!recipe) return null;

  return (
    <div>
      <TopBar title={recipe.name}>
        {/* Opens the edit dialog pre-filled with the current product data */}
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        {/* Back navigation to the products list */}
        <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </Link>

        {/* KPI cards: batch size and ingredient count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Batch Size</p>
              <p className="tabular-nums text-2xl font-bold text-stone-900">
                {recipe.batchSize} unit{recipe.batchSize !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-stone-400 mt-1">units produced per batch</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Ingredients</p>
              <p className="tabular-nums text-2xl font-bold text-stone-900">
                {recipe.ingredients.length}
              </p>
              <p className="text-xs text-stone-400 mt-1">ingredient{recipe.ingredients.length !== 1 ? "s" : ""} in BOM</p>
            </CardContent>
          </Card>
        </div>

        {/* Bill of Materials — what goes into one batch */}
        <Card>
          <CardHeader>
            <CardTitle>Bill of Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.ingredients.length === 0 ? (
              <p className="text-sm text-stone-400">No ingredients added yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {recipe.ingredients.map((line) => (
                  <div key={line.id} className="flex justify-between py-2.5 text-sm">
                    <span className="text-stone-700">{line.ingredient.name}</span>
                    {/* Format quantity with correct unit abbreviation (e.g. 1500 GRAM → "1.5 kg") */}
                    <span className="tabular-nums text-stone-500">
                      {formatUnit(line.quantity, line.ingredient.unit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description, if present */}
        {recipe.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-600">{recipe.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit dialog — pre-populated with the current product */}
      {tenantId && (
        <RecipeFormDialog
          tenantId={tenantId}
          recipe={recipe}
          open={showEdit}
          onOpenChange={setShowEdit}
        />
      )}
    </div>
  );
}
