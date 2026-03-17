import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/types";
import type { Ingredient } from "@prisma/client";

interface StockBadgeProps {
  ingredient: Ingredient;
}

export function StockBadge({ ingredient }: StockBadgeProps) {
  const status = getStockStatus(ingredient);
  const labels = { ok: "In Stock", low: "Low", critical: "Critical" } as const;

  return <Badge variant={status}>{labels[status]}</Badge>;
}
