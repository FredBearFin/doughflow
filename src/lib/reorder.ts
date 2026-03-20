import { prisma } from "./prisma";
import { forecastDailyDemand } from "./forecast";

export type ReorderAlert = {
  ingredient: {
    id: string;
    name: string;
    unit: string;
    reorderQty: number;
    currentStock: number;
    costPerUnit: number;
    supplierId: string | null;
    supplier: { id: string; name: string; email: string | null } | null;
  };
  currentStock: number;
  reorderPoint: number;
  reorderQty: number;
  daysRemaining: number;
};

/**
 * Reorder Point = (avg forecasted daily usage × lead time) + safety stock
 * Safety Stock  = Z × σ̂ × √(lead time)
 *
 * σ̂ is the forecast RMSE — captures model uncertainty during lead time,
 * which is more accurate than raw historical σ.
 * Z = 1.65 → 95 % service level.
 */
export function calculateReorderPoint(params: {
  avgDailyUsage: number;
  leadTimeDays: number;
  usageStdDev: number;
  serviceLevel?: number;
}): number {
  const Z = 1.65;
  const safetyStock = Z * params.usageStdDev * Math.sqrt(params.leadTimeDays);
  return params.avgDailyUsage * params.leadTimeDays + safetyStock;
}

/**
 * Check all ingredients and return those that need a PO generated.
 * Demand is forecast via the best available statistical method
 * (Naïve → SES → Holt → Holt-Winters) depending on history depth.
 */
export async function checkReorderNeeds(tenantId: string): Promise<ReorderAlert[]> {
  const ingredients = await prisma.ingredient.findMany({
    where: { tenantId, active: true },
    include: { supplier: true },
  });

  const alerts: ReorderAlert[] = [];

  for (const ingredient of ingredients) {
    const { avgDailyUsage, sigma } = await forecastDailyDemand(
      tenantId,
      ingredient.id,
      ingredient.leadTimeDays,
    );

    const reorderPoint = calculateReorderPoint({
      avgDailyUsage,
      leadTimeDays: ingredient.leadTimeDays,
      usageStdDev: sigma,
    });

    if (ingredient.currentStock <= reorderPoint) {
      alerts.push({
        ingredient,
        currentStock: ingredient.currentStock,
        reorderPoint,
        reorderQty: ingredient.reorderQty,
        daysRemaining: avgDailyUsage > 0 ? ingredient.currentStock / avgDailyUsage : Infinity,
      });
    }
  }

  return alerts;
}
