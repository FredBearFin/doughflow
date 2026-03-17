"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const tenantId = useTenantId();

  const { data: cogsData } = trpc.analytics.cogsOverTime.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  const { data: topRecipes } = trpc.analytics.topRecipes.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  const { data: wasteData } = trpc.analytics.wasteByIngredient.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  const totalRevenue = cogsData?.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalCOGS = cogsData?.reduce((s, d) => s + d.cogs, 0) ?? 0;
  const totalWaste = wasteData?.reduce((s, d) => s + d.totalCost, 0) ?? 0;

  return (
    <div>
      <TopBar title="Analytics" />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Revenue (30d)", formatCurrency(totalRevenue), "text-stone-900"],
            ["COGS (30d)", formatCurrency(totalCOGS), "text-stone-900"],
            ["Waste Cost (30d)", formatCurrency(totalWaste), "text-red-600"],
          ].map(([label, value, color]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-sm text-stone-500 mb-1">{label}</p>
                <p className={`tabular-nums text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* COGS vs Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs COGS — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {cogsData && cogsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cogsData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cogs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      formatCurrency(Number(value)),
                      name === "revenue" ? "Revenue" : "COGS",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F59E0B"
                    fill="url(#revenue)"
                    strokeWidth={2}
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="cogs"
                    stroke="#DC2626"
                    fill="url(#cogs)"
                    strokeWidth={2}
                    name="cogs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-stone-400">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Recipes by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {!topRecipes || topRecipes.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No sales data yet</p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {topRecipes.map((r, idx) => (
                    <div key={r.recipeName} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-sm text-stone-400 w-5">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-stone-900">{r.recipeName}</p>
                          <p className="text-xs text-stone-400">{r.totalQty} units sold</p>
                        </div>
                      </div>
                      <span className="tabular-nums font-semibold">
                        {formatCurrency(r.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waste by ingredient */}
          <Card>
            <CardHeader>
              <CardTitle>Waste by Ingredient</CardTitle>
            </CardHeader>
            <CardContent>
              {!wasteData || wasteData.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No waste logged</p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {wasteData.slice(0, 8).map((w) => (
                    <div key={w.name} className="flex items-center justify-between py-3">
                      <p className="font-medium text-stone-900">{w.name}</p>
                      <span className="tabular-nums font-semibold text-red-600">
                        {formatCurrency(w.totalCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
