import type { RecipeWithIngredients } from "./bom";

export type COGSLine = {
  ingredientName: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  lineCost: number;
  pctOfTotal: number;
};

export type COGSBreakdown = {
  lines: COGSLine[];
  totalCost: number;
  sellingPrice: number;
  grossMargin: number;
};

/**
 * Calculate COGS for a recipe.
 * Returns cost breakdown per ingredient AND total.
 */
export function calculateRecipeCOGS(recipe: RecipeWithIngredients): COGSBreakdown {
  let totalCost = 0;
  const lines: COGSLine[] = [];

  for (const line of recipe.ingredients) {
    const lineCost = (line.quantity / recipe.yieldPct) * line.ingredient.costPerUnit;
    totalCost += lineCost;
    lines.push({
      ingredientName: line.ingredient.name,
      qty: line.quantity,
      unit: line.ingredient.unit,
      costPerUnit: line.ingredient.costPerUnit,
      lineCost,
      pctOfTotal: 0,
    });
  }

  lines.forEach((l) => {
    l.pctOfTotal = totalCost > 0 ? (l.lineCost / totalCost) * 100 : 0;
  });

  const grossMargin =
    recipe.sellingPrice > 0
      ? ((recipe.sellingPrice - totalCost) / recipe.sellingPrice) * 100
      : 0;

  return {
    lines,
    totalCost,
    sellingPrice: recipe.sellingPrice,
    grossMargin,
  };
}
