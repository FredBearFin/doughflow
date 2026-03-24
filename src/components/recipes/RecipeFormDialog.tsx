"use client";

// RecipeFormDialog — create or edit a product (baked item) and its ingredient BOM.
// Includes Quick Flip pricing: auto-calculates suggested sell price from BOM cost + margin.

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Lock } from "lucide-react";
import Link from "next/link";
import { useTier } from "@/hooks/useTier";

const schema = z.object({
  name:        z.string().min(1, "Name required"),
  description: z.string().optional(),
  batchSize:   z.number().int().min(1, "Batch size must be at least 1"),
  retailPrice: z.number().min(0).optional(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string().min(1, "Select ingredient"),
      quantity:     z.number().min(0.01, "Enter quantity"),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

interface RecipeFormDialogProps {
  tenantId:        string;
  recipe?:         { id: string; name: string; description: string | null; batchSize: number; retailPrice: number | null };
  bomCostPerUnit?: number | null;
  open:            boolean;
  onOpenChange:    (open: boolean) => void;
  onSuccess?:      () => void;
}

export function RecipeFormDialog({
  tenantId,
  recipe,
  bomCostPerUnit,
  open,
  onOpenChange,
  onSuccess,
}: RecipeFormDialogProps) {
  const utils  = trpc.useUtils();
  const isEdit = !!recipe;
  const { hasSuggestedPricing, isLoading: tierLoading } = useTier();

  // Local state for target margin (not saved to DB — just for the pricing calculator)
  const [targetMargin, setTargetMargin] = useState(60);

  // Ingredients list for BOM selector dropdowns
  const { data: ingredients } = trpc.ingredient.getAll.useQuery({ tenantId });

  const create = trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.getAll.invalidate({ tenantId });
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
  });

  const update = trpc.recipe.update.useMutation({
    onSuccess: () => {
      utils.recipe.getAll.invalidate({ tenantId });
      if (recipe) utils.recipe.getById.invalidate({ id: recipe.id, tenantId });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: recipe
      ? {
          name:        recipe.name,
          description: recipe.description ?? undefined,
          batchSize:   recipe.batchSize,
          retailPrice: recipe.retailPrice ?? undefined,
          ingredients: [{ ingredientId: "", quantity: 0 }],
        }
      : {
          batchSize:   1,
          ingredients: [{ ingredientId: "", quantity: 0 }],
        },
  });

  // Dynamic BOM ingredient line management
  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

  const currentRetailPrice = watch("retailPrice");

  // Quick Flip live calculations
  const suggestedPrice = bomCostPerUnit != null && targetMargin > 0 && targetMargin < 100
    ? bomCostPerUnit / (1 - targetMargin / 100)
    : null;

  const actualMargin = bomCostPerUnit != null && currentRetailPrice && currentRetailPrice > 0
    ? ((currentRetailPrice - bomCostPerUnit) / currentRetailPrice) * 100
    : null;

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      update.mutate({ id: recipe.id, tenantId, ...data });
    } else {
      create.mutate({ tenantId, ...data });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !isEdit) reset(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Sourdough Loaf" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Optional description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Optional description" {...register("description")} />
          </div>

          {/* Batch size — how many units one batch produces */}
          <div className="space-y-1.5">
            <Label htmlFor="batchSize">Batch Size (units per batch)</Label>
            <Input
              id="batchSize"
              type="number"
              min="1"
              placeholder="12"
              {...register("batchSize", { valueAsNumber: true })}
            />
            {errors.batchSize && <p className="text-xs text-red-600">{errors.batchSize.message}</p>}
          </div>

          {/* BOM ingredient lines */}
          <div className="space-y-2">
            <Label>Ingredients (per batch)</Label>
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <select
                    className="flex h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    {...register(`ingredients.${idx}.ingredientId`)}
                  >
                    <option value="">Select ingredient…</option>
                    {ingredients?.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...register(`ingredients.${idx}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ingredientId: "", quantity: 0 })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Ingredient
            </Button>
          </div>

          {/* ── Quick Flip Pricing ──────────────────────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-stone-200" />
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Pricing</span>
              <div className="flex-1 border-t border-stone-200" />
            </div>

            {/* BOM cost per unit — read-only, auto-computed */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">BOM Cost / Unit</span>
              {bomCostPerUnit != null ? (
                <span className="font-semibold text-stone-700">{formatCurrency(bomCostPerUnit)}</span>
              ) : (
                <span className="text-stone-400 text-xs">— Set ingredient costs in Pantry to see cost</span>
              )}
            </div>

            {/* Retail price input */}
            <div className="space-y-1.5">
              <Label htmlFor="retailPrice">Your Retail Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  {...register("retailPrice", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Target margin + suggested price — Baker+ only */}
            {!tierLoading && (
              hasSuggestedPricing ? (
                /* Full Quick Flip calculator — only shown when BOM cost is available */
                bomCostPerUnit != null && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="targetMargin" className="text-stone-600 shrink-0">
                        Target Margin
                      </Label>
                      <div className="relative w-24">
                        <Input
                          id="targetMargin"
                          type="number"
                          min="1"
                          max="99"
                          value={targetMargin}
                          onChange={(e) => setTargetMargin(Number(e.target.value))}
                          className="pr-6 text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">%</span>
                      </div>
                    </div>

                    {suggestedPrice !== null && (
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Suggested sell price to hit {targetMargin}% margin</p>
                        <p className="text-xl font-bold text-amber-600">Sell for {formatCurrency(suggestedPrice)}</p>
                      </div>
                    )}

                    {actualMargin !== null && currentRetailPrice && currentRetailPrice > 0 && (
                      <div className="flex items-center justify-between text-sm border-t border-amber-200 pt-3">
                        <span className="text-stone-500">Your margin at {formatCurrency(currentRetailPrice)}</span>
                        <span className={`font-bold ${actualMargin >= targetMargin ? "text-green-600" : "text-red-600"}`}>
                          {actualMargin.toFixed(1)}%
                          {actualMargin < targetMargin && ` (${(targetMargin - actualMargin).toFixed(1)}% below target)`}
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Locked teaser — shown to Free + Cottage users */
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100">
                    <Lock className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-600">Quick Flip Pricing — Pro</p>
                    <p className="text-xs text-stone-400 leading-snug">Auto-calculates your sell price at any target margin.</p>
                  </div>
                  <Link
                    href="/pricing"
                    className="shrink-0 text-xs font-semibold text-amber-600 hover:underline whitespace-nowrap"
                  >
                    Upgrade →
                  </Link>
                </div>
              )
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
