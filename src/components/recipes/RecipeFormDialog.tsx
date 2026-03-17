"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Recipe } from "@prisma/client";
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
import { Plus, Trash2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  batchSize: z.number().int().min(1),
  yieldPct: z.number().min(0.01).max(1),
  sellingPrice: z.number().min(0),
  ingredients: z.array(
    z.object({
      ingredientId: z.string().min(1, "Select ingredient"),
      quantity: z.number().min(0.01, "Enter quantity"),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

interface RecipeFormDialogProps {
  tenantId: string;
  recipe?: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecipeFormDialog({
  tenantId,
  recipe,
  open,
  onOpenChange,
  onSuccess,
}: RecipeFormDialogProps) {
  const utils = trpc.useUtils();
  const isEdit = !!recipe;

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      batchSize: 1,
      yieldPct: 0.95,
      sellingPrice: 0,
      ingredients: [{ ingredientId: "", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

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
          <DialogTitle>{isEdit ? "Edit Recipe" : "New Recipe"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Sourdough Loaf" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Optional description" {...register("description")} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                {...register("batchSize", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yieldPct">Yield %</Label>
              <Input
                id="yieldPct"
                type="number"
                step="0.01"
                min="0.01"
                max="1"
                {...register("yieldPct", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sellingPrice">Price ($)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                {...register("sellingPrice", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredients</Label>
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
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
                <div className="w-28 space-y-1">
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

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
