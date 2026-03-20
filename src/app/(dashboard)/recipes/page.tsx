"use client";

// Products page — /recipes (URL kept for simplicity, label shows "Products")
// Lists all baked products with their ingredient counts and batch size.

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { Plus, UtensilsCrossed } from "lucide-react";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";

export default function RecipesPage() {
  const tenantId = useTenantId();
  const [showCreate, setShowCreate] = useState(false);

  const { data: recipes, isLoading } = trpc.recipe.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  return (
    <div>
      <TopBar title="Products">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </TopBar>

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
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add your first product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-stone-900 mb-1">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-sm text-stone-400 mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    <p className="text-sm text-stone-500 mt-2">
                      {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""} · batch of {recipe.batchSize}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {tenantId && (
        <RecipeFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}
