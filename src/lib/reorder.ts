import { prisma } from "./prisma";

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
 * Lead Time Demand formula:
 * Reorder Point = (Average Daily Usage × Lead Time Days) + Safety Stock
 *
 * Safety Stock = Z × σ(daily usage) × √(lead time)
 * Where Z = 1.65 for 95% service level
 */
export function calculateReorderPoint(params: {
  avgDailyUsage: number;
  leadTimeDays: number;
  usageStdDev: number;
  serviceLevel?: number;
}): number {
  const Z = 1.65; // 95% service level
  const safetyStock = Z * params.usageStdDev * Math.sqrt(params.leadTimeDays);
  return params.avgDailyUsage * params.leadTimeDays + safetyStock;
}

/**
 * Calculate average daily usage and std deviation over the last N days.
 */
export async function calculateAvgDailyUsage(
  tenantId: string,
  ingredientId: string,
  days: number
): Promise<{ avg: number; stdDev: number }> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const ledgerEntries = await prisma.inventoryLedger.findMany({
    where: {
      tenantId,
      ingredientId,
      reason: "PRODUCTION",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  if (ledgerEntries.length === 0) return { avg: 0, stdDev: 0 };

  // Group by day
  const byDay = new Map<string, number>();
  for (const entry of ledgerEntries) {
    const day = entry.createdAt.toISOString().split("T")[0];
    byDay.set(day, (byDay.get(day) ?? 0) + Math.abs(entry.qty));
  }

  const dailyValues = Array.from(byDay.values());
  const avg = dailyValues.reduce((a, b) => a + b, 0) / days; // divide by total days, not active days
  const variance =
    dailyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / Math.max(dailyValues.length, 1);

  return { avg, stdDev: Math.sqrt(variance) };
}

/**
 * Check all ingredients and return those that need a PO generated.
 */
export async function checkReorderNeeds(tenantId: string): Promise<ReorderAlert[]> {
  const ingredients = await prisma.ingredient.findMany({
    where: { tenantId, active: true },
    include: { supplier: true },
  });

  const alerts: ReorderAlert[] = [];

  for (const ingredient of ingredients) {
    const dailyUsage = await calculateAvgDailyUsage(tenantId, ingredient.id, 30);
    const reorderPoint = calculateReorderPoint({
      avgDailyUsage: dailyUsage.avg,
      leadTimeDays: ingredient.leadTimeDays,
      usageStdDev: dailyUsage.stdDev,
    });

    if (ingredient.currentStock <= reorderPoint) {
      alerts.push({
        ingredient,
        currentStock: ingredient.currentStock,
        reorderPoint,
        reorderQty: ingredient.reorderQty,
        daysRemaining:
          dailyUsage.avg > 0 ? ingredient.currentStock / dailyUsage.avg : Infinity,
      });
    }
  }

  return alerts;
}
