"use client";

// Overview page — /overview
// Main dashboard: demand forecast, low stock alerts, waste KPI.

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { DemandForecastPanel } from "@/components/demand/DemandForecastPanel";
import { Package, AlertTriangle, Trash2 } from "lucide-react";
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

  const lowStockItems = ingredients?.filter(
    (i) => i.reorderPoint > 0 && i.currentStock <= i.reorderPoint
  ) ?? [];

  return (
    <div>
      <TopBar title="Overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Ingredients" value={overview?.ingredientCount ?? "—"} icon={<Package className="h-5 w-5 text-amber-500" />} isLoading={isLoading} />
          <StatCard label="Low Stock" value={overview?.lowStockCount ?? "—"} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} highlight={(overview?.lowStockCount ?? 0) > 0} isLoading={isLoading} />
          <StatCard label="Units Wasted (30d)" value={overview?.recentWasteUnits ?? "—"} icon={<Trash2 className="h-5 w-5 text-red-400" />} isLoading={isLoading} />
        </div>

        <DemandForecastPanel />

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
                  <Link key={ing.id} href={`/pantry/${ing.id}`} className="flex items-center justify-between rounded-lg p-3 hover:bg-stone-50 transition-colors">
                    <span className="font-medium text-stone-900">{ing.name}</span>
                    <span className="tabular-nums text-sm text-red-600 font-medium">{ing.currentStock.toFixed(0)} {ing.unit.toLowerCase()} remaining</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/pantry"><Button variant="outline"><Package className="h-4 w-4" />Manage Pantry</Button></Link>
          <Link href="/waste"><Button variant="outline"><Trash2 className="h-4 w-4" />Log End of Day</Button></Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight, isLoading }: { label: string; value: string | number; icon: React.ReactNode; highlight?: boolean; isLoading?: boolean }) {
  return (
    <Card className={highlight ? "border-amber-200 bg-amber-50" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500">{label}</span>
          {icon}
        </div>
        {isLoading ? <div className="h-8 w-20 animate-pulse rounded bg-stone-200" /> : <p className="tabular-nums text-2xl font-bold text-stone-900">{value}</p>}
      </CardContent>
    </Card>
  );
}
