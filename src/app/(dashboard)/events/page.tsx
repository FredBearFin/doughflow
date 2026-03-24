"use client";

/**
 * Event Overrides page — /events
 *
 * Bakers configure event/promo multipliers here.
 * e.g. "Valentine's Day ×2.3" — the demand forecast will multiply automatically.
 *
 * The multiplier is applied to baseQty (the already-buffered number).
 * ×2.0 means "double my normal planned quantity", not raw demand.
 */

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
import { formatDate } from "@/lib/utils";
import { CalendarDays, Trash2, Plus } from "lucide-react";
import { TierGate } from "@/components/TierGate";
import { useTier } from "@/hooks/useTier";

const schema = z.object({
  name:           z.string().min(1, "Event name is required"),
  date:           z.string().min(1, "Date is required").refine(
                    (d) => d >= new Date().toISOString().slice(0, 10),
                    "Date must be today or in the future"
                  ),
  multiplier:     z.number({ invalid_type_error: "Enter a number" })
                   .min(0.1, "Must be at least 0.1×")
                   .max(20,  "Max 20×"),
  recipeId:       z.string().optional(),
  repeatAnnually: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

/**
 * Check whether an existing event conflicts with the incoming form values.
 * Normalises existing.date (ISO string from tRPC) to "YYYY-MM-DD" before comparing.
 */
function isSameDateScope(
  existing: { date: string | Date; recipeId?: string | null },
  incoming: { date: string; recipeId?: string | null }
): boolean {
  const existingDate =
    typeof existing.date === "string"
      ? existing.date.slice(0, 10)               // "2025-02-14T00:00:00.000Z" → "2025-02-14"
      : existing.date.toISOString().slice(0, 10);
  return (
    existingDate === incoming.date &&
    (existing.recipeId ?? null) === (incoming.recipeId ?? null)
  );
}

export default function EventsPage() {
  const tenantId = useTenantId();
  const { hasForecast, isLoading: tierLoading } = useTier();
  const utils    = trpc.useUtils();
  const [saved, setSaved]       = useState(false);
  const [warning, setWarning]   = useState<string | null>(null);

  const { data: events } = trpc.events.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: recipes } = trpc.recipe.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.getAll.invalidate();
      utils.analytics.demandForecast.invalidate();
      setSaved(true);
      setWarning(null);
      reset();
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      utils.events.getAll.invalidate();
      utils.analytics.demandForecast.invalidate();
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
      date:           new Date().toISOString().split("T")[0],
      multiplier:     2.0,
      repeatAnnually: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    // Pre-submit duplicate check (client-side, non-blocking)
    const conflict = events?.find((e) =>
      isSameDateScope(
        { date: e.date as unknown as string, recipeId: e.recipeId },
        { date: data.date, recipeId: data.recipeId || null }
      )
    );
    if (conflict) {
      setWarning(`"${conflict.name}" already exists on this date — the higher multiplier will be used.`);
    }

    createEvent.mutate({
      tenantId:       tenantId!,
      name:           data.name,
      date:           data.date,
      multiplier:     data.multiplier,
      recipeId:       data.recipeId || undefined,
      repeatAnnually: data.repeatAnnually,
    });
  };

  // Clear warning when form changes
  const watchedDate    = watch("date");
  const watchedRecipe  = watch("recipeId");

  return (
    <div>
      <TopBar title="Event Overrides" />

      <div className="p-6 space-y-6">

        {/* Explainer */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-stone-900">Tell DoughFlow about holidays and specials</p>
                <p className="text-sm text-stone-500 mt-0.5">
                  The forecast multiplies automatically on event days.{" "}
                  <span className="font-medium">×2.0 means double your normal planned quantity</span>
                  {" "}— not double raw demand. Perfect for Valentine&apos;s Day, farmers markets, or weekend specials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <TierGate
          allowed={hasForecast}
          isLoading={tierLoading}
          title="Event overrides — Pro feature"
          description="Set date multipliers for holidays and market specials. The Bake Plan applies them automatically — so you bake double for Valentine's Day without thinking about it."
          ctaLabel="Unlock Event Overrides — upgrade to Pro →"
          finePrint="Available on the Pro plan · $9/mo or $99/yr"
          preview={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-amber-500" />
                  Add Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-12 rounded-lg bg-stone-100" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 rounded-lg bg-stone-100" />
                    <div className="h-12 rounded-lg bg-stone-100" />
                  </div>
                  <div className="h-12 rounded-lg bg-stone-100" />
                  <div className="h-12 rounded-xl bg-amber-100" />
                </div>
              </CardContent>
            </Card>
          }
        >
        {/* Add event form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-500" />
              Add Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {saved && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
                Event saved ✓
              </div>
            )}
            {warning && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm">
                ⚠️ {warning}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              onChange={() => setWarning(null)}
            >
              {/* Event name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Valentine's Day, Saturday Market"
                  className="h-12 text-base"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-12 text-base"
                    {...register("date")}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-600">{errors.date.message}</p>
                  )}
                </div>

                {/* Multiplier */}
                <div className="space-y-1.5">
                  <Label htmlFor="multiplier">Multiplier *</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    placeholder="e.g. 2.3"
                    className="h-12 text-base"
                    {...register("multiplier", { valueAsNumber: true })}
                  />
                  {errors.multiplier && (
                    <p className="text-xs text-red-600">{errors.multiplier.message}</p>
                  )}
                </div>
              </div>

              {/* Product (optional) */}
              <div className="space-y-1.5">
                <Label>Product (optional)</Label>
                <select
                  className="flex h-12 w-full rounded-lg border border-stone-200 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  {...register("recipeId")}
                >
                  <option value="">All products</option>
                  {recipes?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repeat annually */}
              <div className="flex items-center gap-3">
                <input
                  id="repeatAnnually"
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                  {...register("repeatAnnually")}
                />
                <Label htmlFor="repeatAnnually" className="cursor-pointer">
                  Repeat annually (e.g. Valentine&apos;s Day every year)
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Saving…" : "Save Event"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Events list */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">
                No events yet — try adding Valentine&apos;s Day at ×2.0
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {[...events]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900">{event.name}</p>
                        <p className="text-xs text-stone-400">
                          {formatDate(event.date as unknown as string)}
                          {event.repeatAnnually && " · repeats annually"}
                          {" · "}
                          {event.recipe ? event.recipe.name : "All products"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold bg-amber-100 text-amber-800">
                          ×{event.multiplier}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-stone-400 hover:text-red-600"
                          disabled={deleteEvent.isPending}
                          onClick={() =>
                            deleteEvent.mutate({ id: event.id, tenantId: tenantId! })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
