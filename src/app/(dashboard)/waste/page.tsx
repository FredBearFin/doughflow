"use client";

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
import { formatUnit } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Trash2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  ingredientId: z.string().min(1, "Select an ingredient"),
  qty: z.number().min(0.01, "Enter a quantity"),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function WastePage() {
  const tenantId = useTenantId();
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: ingredients } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: recentWaste } = trpc.waste.getRecent.useQuery(
    { tenantId: tenantId!, days: 7 },
    { enabled: !!tenantId }
  );

  const { data: wasteSummary } = trpc.waste.getSummary.useQuery(
    { tenantId: tenantId!, days: 7 },
    { enabled: !!tenantId }
  );

  const logWaste = trpc.waste.log.useMutation({
    onSuccess: (_, vars) => {
      const name = ingredients?.find((i) => i.id === vars.ingredientId)?.name ?? "item";
      setLastLogged(name);
      utils.waste.getRecent.invalidate({ tenantId: tenantId! });
      utils.waste.getSummary.invalidate({ tenantId: tenantId! });
      utils.ingredient.getAll.invalidate({ tenantId: tenantId! });
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedId = watch("ingredientId");
  const selectedIngredient = ingredients?.find((i) => i.id === selectedId);

  const onSubmit = (data: FormValues) => {
    logWaste.mutate({ tenantId: tenantId!, ...data });
  };

  const totalWasteCost = wasteSummary?.reduce((sum, s) => sum + s.totalCost, 0) ?? 0;

  return (
    <div>
      <TopBar title="Waste Log" />

      <div className="p-6 space-y-6">
        {/* Log waste form — large touch targets for iPad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Log Waste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastLogged && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {lastLogged} waste logged
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Ingredient *</Label>
                <select
                  className="flex h-14 w-full rounded-lg border border-stone-200 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  {...register("ingredientId")}
                >
                  <option value="">Select ingredient…</option>
                  {ingredients?.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (stock: {formatUnit(i.currentStock, i.unit)})
                    </option>
                  ))}
                </select>
                {errors.ingredientId && (
                  <p className="text-xs text-red-600">{errors.ingredientId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qty">
                    Quantity{selectedIngredient ? ` (${selectedIngredient.unit.toLowerCase()})` : ""}
                    *
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    step="0.01"
                    className="h-14 text-base"
                    placeholder="0"
                    {...register("qty", { valueAsNumber: true })}
                  />
                  {errors.qty && (
                    <p className="text-xs text-red-600">{errors.qty.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    className="h-14 text-base"
                    placeholder="e.g. Expired, Dropped"
                    {...register("reason")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-base"
                disabled={logWaste.isPending}
              >
                <Trash2 className="h-5 w-5" />
                {logWaste.isPending ? "Logging…" : "Log Waste"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary by ingredient */}
          <Card>
            <CardHeader>
              <CardTitle>
                Waste Summary — 7 Days
                <span className="ml-2 text-sm font-normal text-stone-400">
                  ({formatCurrency(totalWasteCost)} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!wasteSummary || wasteSummary.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No waste logged this week</p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {wasteSummary.map((s) => (
                    <div key={s.ingredient.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-stone-900">{s.ingredient.name}</p>
                        <p className="text-xs text-stone-400">
                          {formatUnit(s.totalQty, s.ingredient.unit)} · {s.count} event{s.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold text-red-600">
                        {formatCurrency(s.totalCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentWaste || recentWaste.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No recent waste events</p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {recentWaste.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium text-stone-900">{log.ingredient.name}</p>
                        <p className="text-xs text-stone-400">
                          {log.reason ?? "—"} · {formatDate(log.createdAt)}
                        </p>
                      </div>
                      <span className="tabular-nums text-stone-600">
                        {formatUnit(log.qty, log.ingredient.unit)}
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
