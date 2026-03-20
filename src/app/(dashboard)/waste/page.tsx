"use client";

// End-of-Day Bake Log page — /waste
// Bakers log what they produced and how much was left over at end of day.
// The app uses this data to learn demand patterns and suggest bake quantities.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ClipboardList, CheckCircle2 } from "lucide-react";

// Form validation schema
const schema = z.object({
  recipeId: z.string().min(1, "Select a product"),
  date:     z.string().min(1, "Select a date"),
  qtyBaked: z.number().int().min(1, "Enter how many you baked"),
  qtySold:  z.number().int().min(0, "Enter how many you sold"),
}).refine((d) => d.qtySold <= d.qtyBaked, {
  message: "Sold can't exceed baked",
  path:    ["qtySold"],
});

type FormValues = z.infer<typeof schema>;

export default function WastePage() {
  const tenantId = useTenantId();
  const [lastLogged, setLastLogged] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Load all active products for the selector
  const { data: recipes } = trpc.recipe.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Recent 7 days of bake logs
  const { data: recentLogs } = trpc.waste.getRecent.useQuery(
    { tenantId: tenantId!, days: 7 },
    { enabled: !!tenantId }
  );

  // 30-day waste summary by product
  const { data: wasteSummary } = trpc.waste.getSummary.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  const logWaste = trpc.waste.log.useMutation({
    onSuccess: (_, vars) => {
      const name = recipes?.find((r) => r.id === vars.recipeId)?.name ?? "product";
      setLastLogged(name);
      utils.waste.getRecent.invalidate();
      utils.waste.getSummary.invalidate();
      utils.ingredient.getAll.invalidate(); // Stock was decremented via BOM
      reset();
      setTimeout(() => setLastLogged(null), 3000);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Default date to today
      date: new Date().toISOString().split("T")[0],
    },
  });

  const qtyBaked = watch("qtyBaked") || 0;

  const onSubmit = (data: FormValues) => {
    logWaste.mutate({ tenantId: tenantId!, ...data });
  };

  return (
    <div>
      <TopBar title="End of Day Log" />

      <div className="p-6 space-y-6">
        {/* Log form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              Log Today&apos;s Bake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastLogged && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {lastLogged} logged ✓
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Product selector */}
              <div className="space-y-1.5">
                <Label>Product *</Label>
                <select
                  className="flex h-14 w-full rounded-lg border border-stone-200 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  {...register("recipeId")}
                >
                  <option value="">Select product…</option>
                  {recipes?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {errors.recipeId && (
                  <p className="text-xs text-red-600">{errors.recipeId.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date">Bake Date *</Label>
                <Input
                  id="date"
                  type="date"
                  className="h-14 text-base"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-xs text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* How many baked */}
                <div className="space-y-1.5">
                  <Label htmlFor="qtyBaked">How many baked? *</Label>
                  <Input
                    id="qtyBaked"
                    type="number"
                    min="1"
                    className="h-14 text-base"
                    placeholder="e.g. 24"
                    {...register("qtyBaked", { valueAsNumber: true })}
                  />
                  {errors.qtyBaked && (
                    <p className="text-xs text-red-600">{errors.qtyBaked.message}</p>
                  )}
                </div>

                {/* How many sold */}
                <div className="space-y-1.5">
                  <Label htmlFor="qtySold">How many sold? *</Label>
                  <Input
                    id="qtySold"
                    type="number"
                    min="0"
                    max={qtyBaked}
                    className="h-14 text-base"
                    placeholder="e.g. 19"
                    {...register("qtySold", { valueAsNumber: true })}
                  />
                  {errors.qtySold && (
                    <p className="text-xs text-red-600">{errors.qtySold.message}</p>
                  )}
                </div>
              </div>

              {/* Derived waste count shown live */}
              {qtyBaked > 0 && (
                <p className="text-sm text-stone-500">
                  Wasted:{" "}
                  <span className="font-semibold text-red-600">
                    {Math.max(0, qtyBaked - (watch("qtySold") || 0))} units
                  </span>
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-base"
                disabled={logWaste.isPending}
              >
                {logWaste.isPending ? "Saving…" : "Save End-of-Day Log"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 30-day waste by product */}
          <Card>
            <CardHeader>
              <CardTitle>Waste by Product — 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {!wasteSummary || wasteSummary.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No data yet — start logging!</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {wasteSummary.map((s) => (
                    <div key={s.productName} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-stone-900">{s.productName}</p>
                        <p className="text-xs text-stone-400">
                          {s.totalBaked} baked · {s.totalSold} sold · {s.days} day{s.days !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums font-semibold text-red-600">
                          {s.totalWasted} wasted
                        </p>
                        {/* Show dollar cost of waste when ingredient costs are configured */}
                        {s.costOfWaste > 0 && (
                          <p className="tabular-nums text-xs text-red-400">
                            {formatCurrency(s.costOfWaste)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent individual logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentLogs || recentLogs.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No logs this week</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium text-stone-900">{log.recipe.name}</p>
                        <p className="text-xs text-stone-400">{formatDate(log.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums text-stone-600">{log.qtyBaked} baked</p>
                        <p className="tabular-nums text-red-500 text-xs">
                          {log.qtyBaked - log.qtySold} wasted
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
    </div>
  );
}
