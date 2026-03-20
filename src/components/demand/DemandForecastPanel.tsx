"use client";

// DemandForecastPanel — the hero feature of DoughFlow
// Shows what to bake today based on historical sales patterns.
// Also checks if you have enough ingredients to meet the suggestion.

import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export function DemandForecastPanel() {
  const tenantId = useTenantId();

  // Today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const { data: forecasts, isLoading } = trpc.analytics.demandForecast.useQuery(
    { tenantId: tenantId!, date: today },
    { enabled: !!tenantId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            What to Bake Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            What to Bake Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-400 py-4 text-center">
            Add some products to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          What to Bake Today
          <span className="ml-auto text-sm font-normal text-stone-400">{dayName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {forecasts.map((f) => (
            <div
              key={f.productId}
              className="rounded-lg border border-stone-100 bg-stone-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Product name + suggestion */}
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">{f.productName}</p>

                  {f.suggestedQty === null ? (
                    // Not enough historical data yet
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-stone-400">
                      <Clock className="h-3.5 w-3.5" />
                      Not enough data yet ({f.weeksOfData} log{f.weeksOfData !== 1 ? "s" : ""} recorded)
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 mt-0.5">
                      Avg sold on {dayName}s:{" "}
                      <span className="font-medium text-stone-700">{f.avgSold}</span>
                      {" · "}
                      Based on {f.weeksOfData} week{f.weeksOfData !== 1 ? "s" : ""} of data
                    </p>
                  )}

                  {/* Ingredient shortfall warnings */}
                  {f.shortfalls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {f.shortfalls.map((s) => (
                        <div
                          key={s.ingredientName}
                          className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1"
                        >
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Short {s.short} {s.ingredientName.toLowerCase()} — have {s.available}, need {s.needed}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested qty badge */}
                {f.suggestedQty !== null && (
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-bold text-stone-900 tabular-nums">
                      {f.feasible ? f.suggestedQty : f.maxFeasible}
                    </div>
                    <div className="text-xs text-stone-400">
                      {f.feasible ? "suggested" : "max possible"}
                    </div>
                    {/* Feasibility indicator */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {f.feasible ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs text-green-600">Good to go</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-amber-600">Ingredient short</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
