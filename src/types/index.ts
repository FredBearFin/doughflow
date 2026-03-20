import type {
  Ingredient,
  Recipe,
  RecipeIngredient,
  Supplier,
  PurchaseOrder,
  PurchaseOrderLine,
  WasteLog,
  InventoryLedger,
  Tenant,
  TenantUser,
  User,
} from "@prisma/client";

export type IngredientWithSupplier = Ingredient & {
  supplier: Supplier | null;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

export type PurchaseOrderFull = PurchaseOrder & {
  supplier: Supplier;
  lines: (PurchaseOrderLine & { ingredient: Ingredient })[];
};

export type WasteLogWithIngredient = WasteLog & {
  ingredient: Ingredient;
};

export type LedgerWithIngredient = InventoryLedger & {
  ingredient: Ingredient;
};

export type TenantWithUsers = Tenant & {
  users: (TenantUser & { user: User })[];
};

export type StockStatus = "ok" | "low" | "critical";

export function getStockStatus(ingredient: Ingredient): StockStatus {
  const safetyStock = ingredient.reorderPoint * 0.5;
  if (ingredient.currentStock <= safetyStock) return "critical";
  if (ingredient.currentStock <= ingredient.reorderPoint) return "low";
  return "ok";
}

export function formatUnit(qty: number, unit: string): string {
  const rounded = Math.round(qty * 10) / 10;
  switch (unit) {
    case "LB":    return `${rounded} lb`;
    case "OZ":    return `${rounded} oz`;
    case "FL_OZ": return `${rounded} fl oz`;
    case "CUP":   return rounded === 1 ? "1 cup" : `${rounded} cups`;
    case "TBSP":  return `${rounded} tbsp`;
    case "TSP":   return `${rounded} tsp`;
    case "EACH":  return `${Math.round(qty)} ea`;
    case "GRAM":
      return qty >= 1000 ? `${Math.round(qty / 100) / 10} kg` : `${rounded} g`;
    case "KILOGRAM":
      return `${rounded} kg`;
    case "MILLILITER":
      return qty >= 1000 ? `${Math.round(qty / 100) / 10} L` : `${rounded} mL`;
    case "LITER":
      return `${rounded} L`;
    default:
      return `${rounded} ${unit.toLowerCase()}`;
  }
}
