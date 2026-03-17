"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COGSBreakdown } from "@/components/recipes/COGSBreakdown";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency } from "@/lib/utils";
import { formatUnit } from "@/types";
import { ArrowLeft, Pencil } from "lucide-react";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = useTenantId();
  const [showEdit, setShowEdit] = useState(false);

  const { data: recipe, isLoading } = trpc.recipe.getById.useQuery(
    { id, tenantId: tenantId! },
    { enabled: !!tenantId }
  );

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

  if (!recipe) return null;

  return (
    <div>
      <TopBar title={recipe.name}>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Recipes
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["Batch Size", `${recipe.batchSize} unit${recipe.batchSize !== 1 ? "s" : ""}`],
            ["Yield", `${(recipe.yieldPct * 100).toFixed(0)}%`],
            ["Selling Price", formatCurrency(recipe.sellingPrice)],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-sm text-stone-500 mb-1">{label}</p>
                <p className="tabular-nums text-2xl font-bold text-stone-900">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BOM */}
          <Card>
            <CardHeader>
              <CardTitle>Bill of Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-stone-400">No ingredients yet</p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {recipe.ingredients.map((line) => (
                    <div key={line.id} className="flex justify-between py-2.5 text-sm">
                      <span className="text-stone-700">{line.ingredient.name}</span>
                      <span className="tabular-nums text-stone-500">
                        {formatUnit(line.quantity, line.ingredient.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COGS breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <COGSBreakdown recipe={recipe} />
            </CardContent>
          </Card>
        </div>
      </div>

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
