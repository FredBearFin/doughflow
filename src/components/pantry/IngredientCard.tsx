"use client";

import Link from "next/link";
import type { Ingredient, Supplier } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { StockBadge } from "./StockBadge";
import { formatUnit, getStockStatus } from "@/types";
import { cn } from "@/lib/utils";

type IngredientWithSupplier = Ingredient & { supplier: Supplier | null };

interface IngredientCardProps {
  ingredient: IngredientWithSupplier;
}

export function IngredientCard({ ingredient }: IngredientCardProps) {
  const status = getStockStatus(ingredient);
  const stockPct =
    ingredient.reorderPoint > 0
      ? Math.min((ingredient.currentStock / (ingredient.reorderPoint * 3)) * 100, 100)
      : ingredient.currentStock > 0
      ? 100
      : 0;

  const barColor = {
    ok: "bg-green-500",
    low: "bg-amber-400",
    critical: "bg-red-500",
  }[status];

  return (
    <Link href={`/pantry/${ingredient.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 truncate">{ingredient.name}</h3>
              {ingredient.supplier && (
                <p className="text-xs text-stone-400 mt-0.5">{ingredient.supplier.name}</p>
              )}
            </div>
            <StockBadge ingredient={ingredient} />
          </div>

          {/* Stock level bar */}
          <div className="h-2 w-full rounded-full bg-stone-100 mb-2">
            <div
              className={cn("h-2 rounded-full transition-all", barColor)}
              style={{ width: `${stockPct}%` }}
            />
          </div>

          <div className="flex items-baseline justify-between">
            <span className="tabular-nums text-lg font-semibold text-stone-900">
              {formatUnit(ingredient.currentStock, ingredient.unit)}
            </span>
            {ingredient.reorderPoint > 0 && (
              <span className="text-xs text-stone-400">
                reorder at {formatUnit(ingredient.reorderPoint, ingredient.unit)}
              </span>
            )}
          </div>

          {ingredient.costPerUnit > 0 && (
            <p className="text-xs text-stone-400 mt-1">
              ${ingredient.costPerUnit.toFixed(4)} / {ingredient.unit.toLowerCase()}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
