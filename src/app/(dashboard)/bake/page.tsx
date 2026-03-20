"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { useTier } from "@/hooks/useTier";
import { TierGate } from "@/components/TierGate";
import { formatUnit } from "@/types";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import type { ForecastMethod } from "@/lib/forecast";

// ─── Method display maps ──────────────────────────────────────────────────────

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

// ─── Mock data for the blurred free-tier preview ──────────────────────────────
// Always-visible regardless of whether the user has real sales history.

const MOCK_PLANS: Array<{
  name: string;
  units: number;
  method: ForecastMethod;
  mape: number;
  weekly: number[];
}> = [
  {
    name: "Sourdough Loaf",
    units: 12,
    method: "HOLT_WINTERS",
    mape: 8.2,
    weekly: [12, 10, 14, 11, 13, 12, 15],
  },
  {
    name: "Cinnamon Roll",
    units: 24,
    method: "HOLT",
    mape: 11.4,
    weekly: [24, 20, 22, 26, 24, 28, 25],
  },
  {
    name: "Honey Focaccia",
    units: 8,
    method: "SES",
    mape: 14.1,
    weekly: [8, 6, 9, 7, 8, 10, 9],
  },
];

// Shared card renderer used by both the live data view and the mock preview.
function PlanCard({
  name,
  units,
  method,
  mape,
  weekly,
}: {
  name: string;
  units: number;
  method: ForecastMethod;
  mape: number | null;
  weekly: number[];
}) {
  const max = Math.max(...weekly, 1);
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="font-semibold text-stone-900 leading-tight">{name}</p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${METHOD_COLOR[method]}`}
          >
            {METHOD_LABEL[method]}
          </span>
        </div>

        <p className="tabular-nums text-4xl font-bold text-stone-900 mb-1">
          {units}
          <span className="text-lg font-normal text-stone-400 ml-1">units</span>
        </p>

        {/* 7-day sparkline */}
        <div className="flex items-end gap-0.5 h-10 mt-3">
          {weekly.map((v, i) => (
            <div key={i} className="flex-1" title={`Day ${i + 1}: ${v} units`}>
              <div
                className={`w-full rounded-sm ${i === 0 ? "bg-amber-500" : "bg-stone-200"}`}
                style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-stone-400">Tomorrow</span>
          <span className="text-[10px] text-stone-400">+7d</span>
        </div>

        {mape !== null && (
          <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {mape.toFixed(1)}% avg error
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Mock preview shown blurred to free users ─────────────────────────────────

function MockBakePlanPreview() {
  return (
    <div className="p-6 space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Saturday, Mar 22
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_PLANS.map((p) => (
            <PlanCard
              key={p.name}
              name={p.name}
              units={p.units}
              method={p.method}
              mape={p.mape}
              weekly={p.weekly}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Ingredient Check — Tomorrow
        </h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Ingredient</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500">Needed</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500">In Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: "Bread Flour", needed: "4.8 kg", stock: "3.2 kg", ok: false },
                  { name: "Active Dry Yeast", needed: "48 g", stock: "120 g", ok: true },
                  { name: "Butter", needed: "600 g", stock: "800 g", ok: true },
                ].map((row) => (
                  <tr key={row.name} className={row.ok ? "" : "bg-red-50/50"}>
                    <td className="px-4 py-3 font-medium text-stone-900">{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                      {row.needed}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                      {row.stock}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.ok ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Short 1.6 kg
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BakePlanPage() {
  const tenantId = useTenantId();
  const tier = useTier();

  const { data, isLoading } = trpc.analytics.productionPlan.useQuery(
    { tenantId: tenantId!, horizon: 7 },
    // Only hit the API once we know the user can see the data.
    { enabled: !!tenantId && tier.hasForecast },
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

  // ── Live content (Cottage+) ──────────────────────────────────────────────
  const liveContent = (
    <div className="p-6 space-y-6">
      {/* Shortfall banner */}
      {shortfalls.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Stock shortfall for tomorrow</p>
            <p className="text-sm text-red-600 mt-0.5">
              {shortfalls.map((i) => i.name).join(", ")} — you won&apos;t have enough based on
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
                <PlanCard
                  key={plan.recipeId}
                  name={plan.recipeName}
                  units={plan.tomorrowUnits}
                  method={plan.method as ForecastMethod}
                  mape={plan.metrics.mape}
                  weekly={plan.weeklyForecast.map((d) => d.units)}
                />
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
                    <th className="text-left px-4 py-3 font-medium text-stone-500">Ingredient</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-500">Needed</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-500">In Stock</th>
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
  );

  return (
    <div>
      <TopBar title="Bake Plan" />

      <TierGate
        allowed={tier.hasForecast}
        isLoading={tier.isLoading}
        preview={<MockBakePlanPreview />}
        title="Unlock your Bake Plan"
        description="See exactly how much of each recipe to bake for Saturday's market — powered by your real sales history."
        ctaLabel="Unlock to see how much to bake this weekend →"
      >
        {liveContent}
      </TierGate>
    </div>
  );
}
