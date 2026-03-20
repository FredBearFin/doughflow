// Shared types and utility functions used across client and server code.
import type { Ingredient, Recipe, RecipeIngredient, WasteLog, Tenant, TenantUser, User } from "@prisma/client";

// Ingredient with its BOM lines (for recipe feasibility checks)
export type IngredientWithSupplier = Ingredient; // Simplified: no supplier

// Recipe with fully populated BOM ingredient lines
export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

// WasteLog with its product (Recipe)
export type WasteLogWithRecipe = WasteLog & {
  recipe: Recipe;
};

// Tenant with its user roster
export type TenantWithUsers = Tenant & {
  users: (TenantUser & { user: User })[];
};

// Three-tier stock health indicator
export type StockStatus = "ok" | "low" | "critical";

// Derive stock status from ingredient's current stock vs low-stock threshold
export function getStockStatus(ingredient: Ingredient): StockStatus {
  const safetyStock = ingredient.reorderPoint * 0.5;
  if (ingredient.currentStock <= safetyStock && ingredient.reorderPoint > 0) return "critical";
  if (ingredient.currentStock <= ingredient.reorderPoint && ingredient.reorderPoint > 0) return "low";
  return "ok";
}

// Format a stock quantity with its US bakery unit abbreviation.
// Units: LB | OZ | FL_OZ | CUP | TBSP | TSP | EACH
export function formatUnit(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100; // 2 decimal places for oz/lb precision
  switch (unit) {
    case "LB":
      return `${rounded} lb`;
    case "OZ":
      return `${rounded} oz`;
    case "FL_OZ":
      return `${rounded} fl oz`;
    case "CUP":
      return rounded === 1 ? "1 cup" : `${rounded} cups`;
    case "TBSP":
      return `${rounded} tbsp`;
    case "TSP":
      return `${rounded} tsp`;
    case "EACH":
      return `${Math.round(qty)} ea`;
    default:
      return `${rounded} ${unit.toLowerCase()}`;
  }
}
