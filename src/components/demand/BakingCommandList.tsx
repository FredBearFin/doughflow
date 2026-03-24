"use client";

// BakingCommandList — the urgency-driven baking command center.
// Replaces DemandForecastPanel with action-oriented cards that tell the baker
// exactly what to bake and scream when ingredients are short.
//
// Card urgency tiers:
//   critical — ingredient short, red border, "BAKE [N] [PRODUCT] NOW"
//   warning  — feasible but stock running low, amber border
//   ok       — all good, white card
//   none     — no data yet, muted, prompt to log end of day

import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, ChefHat } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";

export function BakingCommandList() {
  const tenantId = useTenantId();
  const today    = new Date().toISOString().split("T")[0];
  const dayName  = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const { data: forecasts, isLoading } = trpc.analytics.demandForecast.useQuery(
    { tenantId: tenantId!, date: today },
    { enabled: !!tenantId }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">Your kitchen is ready</p>
            <p className="text-xs text-stone-500 mt-0.5">Follow these steps to get your baking commands</p>
          </div>
        </div>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold mt-0.5">1</span>
            <div>
              <Link href="/recipes" className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline">
                Add your products →
              </Link>
              <p className="text-xs text-stone-400 mt-0.5">Sourdough, cinnamon rolls, croissants…</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold mt-0.5">2</span>
            <div>
              <Link href="/waste" className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline">
                Log your first end of day →
              </Link>
              <p className="text-xs text-stone-400 mt-0.5">How many did you bake and sell?</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-500 text-xs font-bold mt-0.5">3</span>
            <div>
              <p className="text-sm font-medium text-stone-400">Come back tomorrow for predictions</p>
              <p className="text-xs text-stone-400 mt-0.5">DoughFlow learns from your history to tell you what to bake</p>
            </div>
          </li>
        </ol>
      </div>
    );
  }

  const criticalCount = forecasts.filter((f) => f.urgency === "critical").length;

  return (
    <div className="space-y-3">
      {/* Page-level banner when any product has an ingredient shortage */}
      {criticalCount > 0 && (
        <div className="rounded-xl bg-red-600 text-white text-center py-3 px-4 font-bold text-sm">
          ⚠ INGREDIENT SHORTAGE — {criticalCount} product{criticalCount !== 1 ? "s" : ""} cannot be fully baked today
        </div>
      )}

      {forecasts.map((f) => {
        const isCritical = f.urgency === "critical";
        const isWarning  = f.urgency === "warning";
        const isNone     = f.urgency === "none";

        // Show max feasible when ingredient is short, otherwise suggested
        const displayQty = f.suggestedQty !== null
          ? (f.feasible ? f.suggestedQty : f.maxFeasible)
          : null;

        const wasteHref = `/waste?recipeId=${f.productId}&qty=${displayQty ?? ""}`;

        const cardClass = isCritical
          ? "border-2 border-red-500 bg-red-50"
          : isWarning
          ? "border-2 border-amber-400 bg-amber-50"
          : isNone
          ? "border border-stone-100 bg-stone-50"
          : "border border-stone-200 bg-white";

        const numberClass = isCritical
          ? "text-red-600"
          : isWarning
          ? "text-amber-700"
          : "text-stone-900";

        const btnClass = isCritical
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-amber-500 hover:bg-amber-600 text-white";

        const headline = isCritical && displayQty !== null
          ? `BAKE ${displayQty} ${f.productName.toUpperCase()} NOW`
          : isWarning && displayQty !== null
          ? `Bake ${displayQty} ${f.productName} Today`
          : displayQty !== null
          ? `Bake ${displayQty} ${f.productName}`
          : f.productName;

        const subText = isCritical
          ? "Cannot fully bake — check pantry"
          : isWarning
          ? "Running low — reorder after today"
          : null;

        return (
          <div key={f.productId} className={`rounded-xl p-4 ${cardClass}`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

              {/* Mobile: big number comes first so it's visible before context */}
              {displayQty !== null && (
                <div className="md:hidden text-center mb-1">
                  <div className={`text-6xl font-black tabular-nums leading-none ${numberClass}`}>
                    {displayQty}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {f.feasible ? "suggested" : "max possible"}
                    {" · "}incl. {((f.bufferApplied - 1) * 100).toFixed(0)}% buffer
                  </div>
                </div>
              )}

              {/* Left: headline, urgency text, shortfalls, meta */}
              <div className="flex-1 min-w-0">
                <p className={`text-lg leading-tight ${
                  isCritical ? "font-black text-red-700"
                  : isWarning ? "font-bold text-amber-800"
                  : isNone    ? "font-semibold text-stone-400"
                  : "font-semibold text-stone-900"
                }`}>
                  {headline}
                </p>

                {subText && (
                  <p className={`text-sm font-semibold mt-0.5 ${isCritical ? "text-red-600" : "text-amber-700"}`}>
                    {subText}
                  </p>
                )}

                {isNone && (
                  <p className="text-sm text-stone-400 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    No {dayName} data yet — log your first end of day to get predictions
                  </p>
                )}

                {/* Ingredient shortfall pills */}
                {f.shortfalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.shortfalls.map((s) => (
                      <span
                        key={s.ingredientName}
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5 font-medium"
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Short {s.short} {s.ingredientName.toLowerCase()} (have {s.available}, need {s.needed})
                      </span>
                    ))}
                  </div>
                )}

                {/* Event multiplier pill */}
                {f.activeEvent && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
                      🎉 {f.activeEvent.name} ×{f.activeEvent.multiplier}
                    </span>
                    {f.baseQty !== null && f.suggestedQty !== f.baseQty && (
                      <span className="ml-2 text-xs text-stone-400">
                        base: {f.baseQty} → {f.suggestedQty}
                      </span>
                    )}
                  </div>
                )}

                {/* Model + accuracy meta (small, unobtrusive) */}
                {f.model !== "none" && (
                  <p className="text-xs text-stone-400 mt-1.5">
                    {f.model === "wma"
                      ? `WMA · ${f.dataPoints} pts`
                      : `Holt-Winters · ${f.dataPoints} pts`}
                    {f.avgSold !== null && ` · avg ${f.avgSold} sold on ${dayName}s`}
                    {f.mad !== null && ` · avg miss ${f.mad}`}
                  </p>
                )}
              </div>

              {/* Right: big number — desktop only */}
              {displayQty !== null && (
                <div className="hidden md:block text-right shrink-0">
                  <div className={`text-6xl font-black tabular-nums leading-none ${numberClass}`}>
                    {displayQty}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {f.feasible ? "suggested" : "max possible"}
                    {" · "}incl. {((f.bufferApplied - 1) * 100).toFixed(0)}% buffer
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {f.feasible ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs text-green-600">Good to go</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-600">Ingredient short</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mark as Baked CTA — full-width, large tap target */}
            {!isNone && displayQty !== null && (
              <Link
                href={wasteHref}
                className={`mt-3 flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition-colors ${btnClass}`}
              >
                Mark as Baked — Log End of Day
              </Link>
            )}
            {isNone && (
              <Link
                href="/waste"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Log End of Day →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
