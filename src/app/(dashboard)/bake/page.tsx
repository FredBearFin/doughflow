"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatUnit } from "@/types";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import type { ForecastMethod } from "@/lib/forecast";

const METHOD_LABEL: Record<ForecastMethod, string> = {
  NAIVE: "Naïve",
  SMA: "SMA",
  SES: "Exp. Smoothing",
  HOLT: "Holt (trend)",
  HOLT_WINTERS: "Holt-Winters",
};

const METHOD_COLOR: Record<ForecastMethod, string> = {
  NAIVE: "bg-stone-100 text-stone-600",
  SMA: "bg-stone-100 text-stone-600",
  SES: "bg-blue-50 text-blue-700",
  HOLT: "bg-violet-50 text-violet-700",
  HOLT_WINTERS: "bg-amber-50 text-amber-700",
};

export default function BakePlanPage() {
  const tenantId = useTenantId();

  const { data, isLoading } = trpc.analytics.productionPlan.useQuery(
    { tenantId: tenantId!, horizon: 7 },
    { enabled: !!tenantId },
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLabel = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const shortfalls = data?.ingredientCheck.filter((i) => i.deficit > 0) ?? [];
  const sufficient = data?.ingredientCheck.filter((i) => i.deficit === 0) ?? [];

  return (
    <div>
      <TopBar title="Bake Plan" />

      <div className="p-6 space-y-6">
        {/* Shortfall banner */}
        {shortfalls.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Stock shortfall for tomorrow</p>
              <p className="text-sm text-red-600 mt-0.5">
                {shortfalls.map((i) => i.name).join(", ")} — you won't have enough based on
                forecasted demand.
              </p>
            </div>
          </div>
        )}

        {/* Recipe forecast cards */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            {tomorrowLabel}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-stone-200" />
              ))}
            </div>
          ) : data?.plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-stone-400">
                No recipes yet. Add recipes and log sales to generate a bake plan.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.plans
                .slice()
                .sort((a, b) => b.tomorrowUnits - a.tomorrowUnits)
                .map((plan) => (
                  <Card key={plan.recipeId} className="relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-semibold text-stone-900 leading-tight">
                          {plan.recipeName}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${METHOD_COLOR[plan.method as ForecastMethod]}`}
                        >
                          {METHOD_LABEL[plan.method as ForecastMethod]}
                        </span>
                      </div>

                      <p className="tabular-nums text-4xl font-bold text-stone-900 mb-1">
                        {plan.tomorrowUnits}
                        <span className="text-lg font-normal text-stone-400 ml-1">units</span>
                      </p>

                      {/* 7-day mini chart */}
                      <div className="flex items-end gap-0.5 h-10 mt-3">
                        {plan.weeklyForecast.map((day, i) => {
                          const max = Math.max(...plan.weeklyForecast.map((d) => d.units), 1);
                          const pct = (day.units / max) * 100;
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-0.5"
                              title={`${day.date}: ${day.units} units`}
                            >
                              <div
                                className={`w-full rounded-sm ${i === 0 ? "bg-amber-500" : "bg-stone-200"}`}
                                style={{ height: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-stone-400">Tomorrow</span>
                        <span className="text-[10px] text-stone-400">+7d</span>
                      </div>

                      {/* Accuracy hint */}
                      {plan.metrics.mape !== null && (
                        <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {plan.metrics.mape.toFixed(1)}% avg error
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </section>

        {/* Ingredient check */}
        {(data?.ingredientCheck.length ?? 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Ingredient Check — Tomorrow
            </h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left px-4 py-3 font-medium text-stone-500">
                        Ingredient
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-stone-500">Needed</th>
                      <th className="text-right px-4 py-3 font-medium text-stone-500">
                        In Stock
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-stone-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {shortfalls.map((i) => (
                      <tr key={i.name} className="bg-red-50/50">
                        <td className="px-4 py-3 font-medium text-stone-900">{i.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                          {formatUnit(i.required, i.unit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                          {formatUnit(i.available, i.unit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Short {formatUnit(i.deficit, i.unit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sufficient.map((i) => (
                      <tr key={i.name}>
                        <td className="px-4 py-3 text-stone-700">{i.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-stone-500">
                          {formatUnit(i.required, i.unit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-stone-500">
                          {formatUnit(i.available, i.unit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
