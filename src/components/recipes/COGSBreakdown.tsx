"use client";

import { calculateRecipeCOGS } from "@/lib/cogs";
import type { RecipeWithIngredients } from "@/lib/bom";
import { formatCurrency } from "@/lib/utils";

interface COGSBreakdownProps {
  recipe: RecipeWithIngredients;
}

export function COGSBreakdown({ recipe }: COGSBreakdownProps) {
  const breakdown = calculateRecipeCOGS(recipe);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {breakdown.lines.map((line) => (
          <div key={line.ingredientName} className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between text-sm">
              <span className="text-stone-700">{line.ingredientName}</span>
              <span className="tabular-nums text-stone-500">
                {formatCurrency(line.lineCost)}
              </span>
            </div>
            <div className="w-24 h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-2 rounded-full bg-amber-400"
                style={{ width: `${line.pctOfTotal}%` }}
              />
            </div>
            <span className="tabular-nums text-xs text-stone-400 w-10 text-right">
              {line.pctOfTotal.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-100 pt-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Total COGS</span>
          <span className="tabular-nums font-semibold">{formatCurrency(breakdown.totalCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Selling Price</span>
          <span className="tabular-nums font-semibold">{formatCurrency(breakdown.sellingPrice)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className={breakdown.grossMargin >= 60 ? "text-green-600" : breakdown.grossMargin >= 40 ? "text-amber-600" : "text-red-600"}>
            Gross Margin
          </span>
          <span className={`tabular-nums ${breakdown.grossMargin >= 60 ? "text-green-600" : breakdown.grossMargin >= 40 ? "text-amber-600" : "text-red-600"}`}>
            {breakdown.grossMargin.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
