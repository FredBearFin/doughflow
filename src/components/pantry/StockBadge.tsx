/**
 * StockBadge — a small coloured badge indicating an ingredient's stock level.
 *
 * Derives the stock status ("ok", "low", or "critical") from the ingredient
 * record using the shared `getStockStatus` utility (src/types/index.ts) and
 * maps it to a human-readable label and a Badge variant for colour styling.
 *
 * Stock status thresholds (defined in getStockStatus):
 *   critical — currentStock <= reorderPoint × 0.5
 *   low      — currentStock <= reorderPoint
 *   ok       — currentStock > reorderPoint
 *
 * Badge variant → colour (defined in src/components/ui/badge.tsx):
 *   ok       → green
 *   low      → amber
 *   critical → red
 *
 * Used on:
 *   - IngredientCard (pantry grid)
 *   - Ingredient detail page (/pantry/[id])
 */

import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/types";
import type { Ingredient } from "@prisma/client";

/**
 * Props for StockBadge.
 *
 * @param ingredient - The Prisma Ingredient record; needs currentStock and
 *                     reorderPoint to compute the stock status
 */
interface StockBadgeProps {
  ingredient: Ingredient;
}

/**
 * StockBadge renders a colour-coded badge showing the ingredient's stock health.
 *
 * @param ingredient - The ingredient whose stock level is being displayed
 */
export function StockBadge({ ingredient }: StockBadgeProps) {
  // Compute "ok" | "low" | "critical" from current stock vs reorder point
  const status = getStockStatus(ingredient);

  // Map each status to a human-readable label displayed inside the badge
  const labels = { ok: "In Stock", low: "Low", critical: "Critical" } as const;

  // The variant drives the Badge colour (see badge.tsx for the variant-to-colour map)
  return <Badge variant={status}>{labels[status]}</Badge>;
}
