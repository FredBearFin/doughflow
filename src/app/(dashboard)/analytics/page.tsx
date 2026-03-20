"use client";

// Analytics page — /analytics
// Shows waste trends, day-of-week patterns, and per-product waste breakdowns.
// Focused entirely on operational waste insights (no revenue/COGS).

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const tenantId = useTenantId();

  // Waste by product for the last 30 days
  const { data: wasteByProduct } = trpc.analytics.wasteByProduct.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  // Day-of-week waste patterns for the last 90 days
  const { data: wasteByDay } = trpc.analytics.wasteByDayOfWeek.useQuery(
    { tenantId: tenantId!, days: 90 },
    { enabled: !!tenantId }
  );

  // Total units wasted in last 30 days
  const totalWasted = wasteByProduct?.reduce((s, p) => s + p.totalWasted, 0) ?? 0;
  const totalBaked  = wasteByProduct?.reduce((s, p) => s + p.totalBaked,  0) ?? 0;
  const wasteRate   = totalBaked > 0 ? ((totalWasted / totalBaked) * 100).toFixed(1) : "0";

  return (
    <div>
      <TopBar title="Analytics" />

      <div className="p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
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
        </div>

        {/* Day of week waste bar chart */}
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
      </div>
    </div>
  );
}
