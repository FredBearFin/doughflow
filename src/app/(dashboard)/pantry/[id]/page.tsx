"use client";

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
import { formatUnit, formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pencil, SlidersHorizontal } from "lucide-react";

const REASON_LABEL: Record<string, string> = {
  PURCHASE: "Purchase",
  PRODUCTION: "Production",
  WASTE: "Waste",
  ADJUSTMENT: "Adjustment",
  OPENING: "Opening Stock",
};

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-sm text-stone-500 mb-1">Reorder Point</p>
              <p className="tabular-nums text-3xl font-bold text-stone-900">
                {formatUnit(ingredient.reorderPoint, ingredient.unit)}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Lead time: {ingredient.leadTimeDays}d
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Cost per Unit</p>
              <p className="tabular-nums text-3xl font-bold text-stone-900">
                ${ingredient.costPerUnit.toFixed(4)}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                per {ingredient.unit.toLowerCase()}
              </p>
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
                ["SKU", ingredient.sku ?? "—"],
                ["Unit", ingredient.unit],
                ["Reorder Qty", formatUnit(ingredient.reorderQty, ingredient.unit)],
                ["Supplier", ingredient.supplier?.name ?? "—"],
                ["Shelf Life", ingredient.shelfLifeDays ? `${ingredient.shelfLifeDays} days` : "—"],
                ["Stock Value", formatCurrency(ingredient.currentStock * ingredient.costPerUnit)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-stone-400">{label}</dt>
                  <dd className="font-medium text-stone-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Ledger history */}
        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredient.ledgerEntries.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No movements recorded</p>
            ) : (
              <div className="space-y-0 divide-y divide-stone-100">
                {ingredient.ledgerEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {REASON_LABEL[entry.reason] ?? entry.reason}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-stone-400">{entry.note}</p>
                      )}
                      <p className="text-xs text-stone-400">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`tabular-nums font-semibold ${
                        entry.qty >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {entry.qty >= 0 ? "+" : ""}
                      {formatUnit(entry.qty, ingredient.unit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
