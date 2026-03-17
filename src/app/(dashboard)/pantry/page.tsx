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

export default function PantryPage() {
  const tenantId = useTenantId();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: ingredients, isLoading } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const filtered = ingredients?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const criticalCount = filtered?.filter((i) => i.currentStock <= i.reorderPoint * 0.5 && i.reorderPoint > 0).length ?? 0;
  const lowCount = filtered?.filter((i) => i.currentStock <= i.reorderPoint && i.currentStock > i.reorderPoint * 0.5 && i.reorderPoint > 0).length ?? 0;

  return (
    <div>
      <TopBar title="Pantry">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </TopBar>

      <div className="p-6 space-y-5">
        {/* Summary chips */}
        {(criticalCount > 0 || lowCount > 0) && (
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {criticalCount} critical
              </span>
            )}
            {lowCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {lowCount} low
              </span>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-stone-400 text-lg mb-4">No ingredients yet</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add your first ingredient
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered?.map((ing) => (
              <IngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        )}
      </div>

      {tenantId && (
        <IngredientFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}
