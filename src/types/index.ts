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

// Format a stock quantity with smart unit scaling
// e.g. 1500 GRAM → "1.5 kg", 250 MILLILITER → "250 mL", 12 EACH → "12 ea"
export function formatUnit(qty: number, unit: string): string {
  const rounded = Math.round(qty * 10) / 10;
  switch (unit) {
    case "GRAM":
      return qty >= 1000 ? `${Math.round(qty / 100) / 10} kg` : `${rounded} g`;
    case "KILOGRAM":
      return `${rounded} kg`;
    case "MILLILITER":
      return qty >= 1000 ? `${Math.round(qty / 100) / 10} L` : `${rounded} mL`;
    case "LITER":
      return `${rounded} L`;
    case "EACH":
      return `${rounded} ea`;
    default:
      return `${rounded} ${unit.toLowerCase()}`;
  }
}
