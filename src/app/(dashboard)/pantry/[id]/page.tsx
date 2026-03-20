"use client";

// Ingredient detail page — /pantry/[id]
// Shows current stock, low-stock threshold, and action buttons to edit or adjust stock.

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockBadge } from "@/components/pantry/StockBadge";
import { AdjustStockDialog } from "@/components/pantry/AdjustStockDialog";
import { IngredientFormDialog } from "@/components/pantry/IngredientFormDialog";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatUnit, formatDate } from "@/lib/utils";
import { ArrowLeft, Pencil, SlidersHorizontal } from "lucide-react";

export default function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = useTenantId();
  const [showAdjust, setShowAdjust] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { data: ingredient, isLoading } = trpc.ingredient.getById.useQuery(
    { id, tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading…" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!ingredient) return null;

  return (
    <div>
      <TopBar title={ingredient.name}>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="sm" onClick={() => setShowAdjust(true)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Adjust Stock
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        <Link href="/pantry" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Pantry
        </Link>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Current Stock</p>
              <p className="tabular-nums text-3xl font-bold text-stone-900">
                {formatUnit(ingredient.currentStock, ingredient.unit)}
              </p>
              <div className="mt-2">
                <StockBadge ingredient={ingredient} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Low Stock Alert At</p>
              <p className="tabular-nums text-3xl font-bold text-stone-900">
                {ingredient.reorderPoint > 0
                  ? formatUnit(ingredient.reorderPoint, ingredient.unit)
                  : "Not set"}
              </p>
              <p className="text-xs text-stone-400 mt-1">per {ingredient.unit.toLowerCase()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Unit",          ingredient.unit],
                ["Added",         formatDate(ingredient.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-stone-400">{label}</dt>
                  <dd className="font-medium text-stone-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      {tenantId && (
        <>
          <AdjustStockDialog
            ingredient={ingredient}
            tenantId={tenantId}
            open={showAdjust}
            onOpenChange={setShowAdjust}
          />
          <IngredientFormDialog
            tenantId={tenantId}
            ingredient={ingredient}
            open={showEdit}
            onOpenChange={setShowEdit}
          />
        </>
      )}
    </div>
  );
}
