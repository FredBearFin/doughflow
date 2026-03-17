import type { Recipe, RecipeIngredient, Ingredient } from "@prisma/client";

export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

/**
 * Calculate ingredient consumption for a sale.
 * Accounts for yield loss (e.g. 5% mixing/baking loss).
 *
 * @param recipe  - Recipe with its RecipeIngredient lines
 * @param qtySold - Number of units sold
 * @returns Map of ingredientId → quantity consumed (in base unit)
 */
export function explodeBOM(
  recipe: RecipeWithIngredients,
  qtySold: number
): Map<string, number> {
  const consumption = new Map<string, number>();
  const batchesNeeded = qtySold / recipe.batchSize;

  for (const line of recipe.ingredients) {
    // Divide by yield to account for production loss
    // e.g., yieldPct=0.95 means we need ~5.26% MORE than the recipe states
    const rawQty = (line.quantity * batchesNeeded) / recipe.yieldPct;
    consumption.set(line.ingredientId, rawQty);
  }

  return consumption;
}
