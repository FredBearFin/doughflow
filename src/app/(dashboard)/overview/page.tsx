/**
 * Overview page — /overview
 *
 * The main dashboard. Shows three things:
 *   1. KPI cards: ingredient count, low stock alert count, and waste cost (or units)
 *   2. Demand forecast panel — the hero feature: "What to bake today"
 *   3. Low stock alerts — any ingredient at or below its alert threshold
 *
 * The waste KPI shows dollar value (e.g. "$47 wasted") when any ingredient has
 * a costPerUnit set, and falls back to unit count when costs aren't configured.
 *
 * This is a Client Component because it reads tenantId from the client session.
 */

"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency } from "@/lib/utils";
import { DemandForecastPanel } from "@/components/demand/DemandForecastPanel";
import { Package, AlertTriangle, DollarSign, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const tenantId = useTenantId();

  const { data: overview, isLoading } = trpc.analytics.overview.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: ingredients } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Items that are at or below their low-stock threshold
  const lowStockItems = ingredients?.filter(
    (i) => i.reorderPoint > 0 && i.currentStock <= i.reorderPoint
  ) ?? [];

  // Use dollar KPI when cost data is available, otherwise fall back to units
  const hasCostData = (overview?.wasteCost30d ?? 0) > 0;

  return (
    <div>
      <TopBar title="Overview" />
      <div className="p-6 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Ingredients"
            value={overview?.ingredientCount ?? "—"}
            icon={<Package className="h-5 w-5 text-amber-500" />}
            isLoading={isLoading}
          />
          <StatCard
            label="Low Stock"
            value={overview?.lowStockCount ?? "—"}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            highlight={(overview?.lowStockCount ?? 0) > 0}
            isLoading={isLoading}
          />
          {/* Waste KPI: show dollars if costs configured, otherwise show units */}
          <StatCard
            label={hasCostData ? "Waste Cost (30d)" : "Units Wasted (30d)"}
            value={
              hasCostData
                ? formatCurrency(overview?.wasteCost30d ?? 0)
                : (overview?.recentWasteUnits ?? "—")
            }
            subValue={hasCostData ? `${overview?.recentWasteUnits ?? 0} units` : undefined}
            icon={
              hasCostData
                ? <DollarSign className="h-5 w-5 text-red-400" />
                : <Trash2 className="h-5 w-5 text-red-400" />
            }
            isLoading={isLoading}
          />
        </div>

        {/* Hero feature: demand forecast + ingredient feasibility */}
        <DemandForecastPanel />

        {/* Low stock alerts — only shown when there are items at/below threshold */}
        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.slice(0, 6).map((ing) => (
                  <Link
                    key={ing.id}
                    href={`/pantry/${ing.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-medium text-stone-900">{ing.name}</span>
                    <span className="tabular-nums text-sm text-red-600 font-medium">
                      {ing.currentStock.toFixed(0)} {ing.unit.toLowerCase()} remaining
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href="/pantry">
            <Button variant="outline">
              <Package className="h-4 w-4" />
              Manage Pantry
            </Button>
          </Link>
          <Link href="/waste">
            <Button variant="outline">
              <Trash2 className="h-4 w-4" />
              Log End of Day
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

/** KPI stat card with optional sub-label and loading skeleton */
function StatCard({
  label,
  value,
  icon,
  highlight,
  isLoading,
  subValue,
}: {
  label:      string;
  value:      string | number;
  icon:       React.ReactNode;
  highlight?: boolean;
  isLoading?: boolean;
  subValue?:  string;
}) {
  return (
    <Card className={highlight ? "border-amber-200 bg-amber-50" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500">{label}</span>
          {icon}
        </div>
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-stone-200" />
        ) : (
          <>
            <p className="tabular-nums text-2xl font-bold text-stone-900">{value}</p>
            {subValue && (
              <p className="text-xs text-stone-400 mt-0.5">{subValue}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
