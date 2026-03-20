"use client";

// IngredientCard — compact pantry card showing stock status at a glance.
// Click to navigate to the ingredient detail page.

import Link from "next/link";
import type { Ingredient } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { StockBadge } from "./StockBadge";
import { formatUnit, getStockStatus } from "@/types";
import { cn } from "@/lib/utils";

interface IngredientCardProps {
  ingredient: Ingredient;
}

export function IngredientCard({ ingredient }: IngredientCardProps) {
  const status = getStockStatus(ingredient);

  // Bar width proportional to stock vs 3× alert threshold
  const stockPct =
    ingredient.reorderPoint > 0
      ? Math.min((ingredient.currentStock / (ingredient.reorderPoint * 3)) * 100, 100)
      : ingredient.currentStock > 0 ? 100 : 0;

  const barColor = {
    ok:       "bg-green-500",
    low:      "bg-amber-400",
    critical: "bg-red-500",
  }[status];

  return (
    <Link href={`/pantry/${ingredient.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          {/* Name + badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-stone-900 truncate">{ingredient.name}</h3>
            <StockBadge ingredient={ingredient} />
          </div>

          {/* Stock level bar */}
          <div className="h-2 w-full rounded-full bg-stone-100 mb-2">
            <div
              className={cn("h-2 rounded-full transition-all", barColor)}
              style={{ width: `${stockPct}%` }}
            />
          </div>

          {/* Current stock + alert threshold */}
          <div className="flex items-baseline justify-between">
            <span className="tabular-nums text-lg font-semibold text-stone-900">
              {formatUnit(ingredient.currentStock, ingredient.unit)}
            </span>
            {ingredient.reorderPoint > 0 && (
              <span className="text-xs text-stone-400">
                alert at {formatUnit(ingredient.reorderPoint, ingredient.unit)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
