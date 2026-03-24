/**
 * Today's Kitchen — /overview
 *
 * The unified command center. Two sections:
 *   1. Baking commands (above the fold) — urgent baking list + low stock alerts
 *   2. Waste trends (below the fold) — absorbed from the old Analytics page
 *
 * This is a Client Component because it reads tenantId from the client session.
 */

"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency } from "@/lib/utils";
import { BakingCommandList } from "@/components/demand/BakingCommandList";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { TierGate } from "@/components/TierGate";
import { useTier } from "@/hooks/useTier";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OverviewPage() {
  const tenantId = useTenantId();
  const { hasAnalytics, isLoading: tierLoading } = useTier();

  const { data: ingredients } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Waste trend data (from the old analytics page)
  const { data: wasteByProduct } = trpc.analytics.wasteByProduct.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );
  const { data: wasteByDay } = trpc.analytics.wasteByDayOfWeek.useQuery(
    { tenantId: tenantId!, days: 90 },
    { enabled: !!tenantId }
  );

  // Aggregate waste KPIs
  const totalWasted = wasteByProduct?.reduce((s, p) => s + p.totalWasted, 0) ?? 0;
  const totalBaked  = wasteByProduct?.reduce((s, p) => s + p.totalBaked,  0) ?? 0;
  const wasteRate   = totalBaked > 0 ? ((totalWasted / totalBaked) * 100).toFixed(1) : "0";
  const totalCost   = wasteByProduct?.reduce((s, p) => s + p.costOfWaste, 0) ?? 0;
  const hasCostData = totalCost > 0;

  const lowStockItems = ingredients?.filter(
    (i) => i.reorderPoint > 0 && i.currentStock <= i.reorderPoint
  ) ?? [];

  return (
    <div>
      <TopBar title="Today's Kitchen" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        {/* ── Baking Command List ────────────────────────────────────── */}
        <BakingCommandList />

        {/* ── Low Stock Alerts ──────────────────────────────────────── */}
        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Low Stock Alerts
                </CardTitle>
                <Link href="/pantry" className="text-xs text-amber-600 hover:underline font-medium">
                  See all in Pantry →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {lowStockItems.map((ing) => (
                  <Link
                    key={ing.id}
                    href={`/pantry/${ing.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-medium text-stone-900">{ing.name}</span>
                    <span className="tabular-nums text-sm text-red-600 font-medium">
                      {ing.currentStock <= 0
                        ? "Out"
                        : `${ing.currentStock.toFixed(1)} ${ing.unit.toLowerCase()} remaining`}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Waste Trends (Baker+) ─────────────────────────────────── */}
        <TierGate
          allowed={hasAnalytics}
          isLoading={tierLoading}
          title="Waste analytics & trends"
          description="See which products waste the most, which days are worst, and the dollar cost of what you throw away. Upgrade to Baker to unlock charts and KPI cards."
          ctaLabel="Unlock waste analytics — upgrade to Pro →"
          finePrint="Available on the Pro plan · $9/mo or $99/yr"
          preview={
            <div className="space-y-4">
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 border-t border-stone-200" />
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Waste Trends</span>
                <div className="flex-1 border-t border-stone-200" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Units Wasted (30d)", "Units Baked (30d)", "Waste Rate (30d)", "Waste Cost (30d)"].map((label) => (
                  <Card key={label}><CardContent className="p-5"><p className="text-sm text-stone-300 mb-1">{label}</p><div className="h-8 w-16 rounded bg-stone-100" /></CardContent></Card>
                ))}
              </div>
              <Card><CardContent className="p-5"><div className="h-48 rounded bg-stone-50" /></CardContent></Card>
            </div>
          }
        >
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 border-t border-stone-200" />
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Waste Trends</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>

        {/* Waste KPI cards — 2×2 on mobile, 4 in a row on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Units Wasted (30d)</p>
              <p className="tabular-nums text-2xl font-bold text-red-600">{totalWasted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Units Baked (30d)</p>
              <p className="tabular-nums text-2xl font-bold text-stone-900">{totalBaked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Waste Rate (30d)</p>
              <p className="tabular-nums text-2xl font-bold text-amber-600">{wasteRate}%</p>
            </CardContent>
          </Card>
          <Card className={hasCostData ? "border-red-100" : undefined}>
            <CardContent className="p-5">
              <p className="text-sm text-stone-500 mb-1">Waste Cost (30d)</p>
              {hasCostData ? (
                <p className="tabular-nums text-2xl font-bold text-red-600">
                  {formatCurrency(totalCost)}
                </p>
              ) : (
                <p className="text-sm text-stone-400 mt-1 leading-snug">
                  Set ingredient costs in Pantry to see $
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Waste by day of week bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Waste by Day of Week — Last 90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {wasteByDay && wasteByDay.some((d) => d.totalWasted > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={wasteByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis
                    dataKey="dayName"
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    tickFormatter={(v: string) => v.slice(0, 3)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#78716C" }} />
                  <Tooltip
                    formatter={(value: unknown) => [`${value} units wasted`, "Wasted"]}
                  />
                  <Bar dataKey="totalWasted" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Wasted" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-stone-400">
                No waste data yet — log some end-of-day results first
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waste by product breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Waste by Product — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {!wasteByProduct || wasteByProduct.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No data yet</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {wasteByProduct.map((p) => (
                  <div key={p.productName} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-stone-900">{p.productName}</p>
                      <p className="text-xs text-stone-400">
                        {p.totalBaked} baked · {p.totalSold} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-semibold text-red-600">
                        {p.totalWasted} wasted
                      </p>
                      {p.costOfWaste > 0 && (
                        <p className="tabular-nums text-xs text-red-400">
                          {formatCurrency(p.costOfWaste)}
                        </p>
                      )}
                      <p className="text-xs text-stone-400">
                        {p.wasteRate.toFixed(1)}% waste rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </TierGate>

      </div>
    </div>
  );
}
