/**
 * IngredientFormDialog — create or edit a pantry ingredient.
 *
 * Fields:
 *   - Name (required)
 *   - Unit (required) — US bakery units + metric
 *   - Current Stock (required, min 0)
 *   - Low Stock Alert At (reorderPoint, min 0)
 *   - Cost per unit (optional — enables dollar-value waste analytics)
 *
 * The cost field is optional. When set, the analytics and waste pages will
 * show the dollar value of waste (e.g. "$47 wasted this week") in addition
 * to unit counts. Leave it blank to keep the app unit-only.
 *
 * In edit mode the dialog is pre-populated with the ingredient's current values.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Ingredient } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const US_UNITS  = ["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH"] as const;
const MET_UNITS = ["GRAM", "KILOGRAM", "MILLILITER", "LITER"] as const;
const ALL_UNITS = [...US_UNITS, ...MET_UNITS] as const;
type Unit = typeof ALL_UNITS[number];

const schema = z.object({
  name:           z.string().min(1, "Name required"),
  unit:           z.enum(ALL_UNITS),
  currentStock:   z.number().min(0),
  reorderPoint:   z.number().min(0),
  costPerUnit:    z.number().min(0).nullable().optional(),
  wholeUnitsOnly: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const UNIT_LABELS: Record<Unit, string> = {
  LB:         "Pound (lb)",
  OZ:         "Ounce (oz)",
  FL_OZ:      "Fluid Ounce (fl oz)",
  CUP:        "Cup",
  TBSP:       "Tablespoon (tbsp)",
  TSP:        "Teaspoon (tsp)",
  EACH:       "Each",
  GRAM:       "Gram (g)",
  KILOGRAM:   "Kilogram (kg)",
  MILLILITER: "Milliliter (ml)",
  LITER:      "Liter (L)",
};

/** Short abbreviation for the cost field label */
const UNIT_ABBR: Record<Unit, string> = {
  LB:         "lb",
  OZ:         "oz",
  FL_OZ:      "fl oz",
  CUP:        "cup",
  TBSP:       "tbsp",
  TSP:        "tsp",
  EACH:       "each",
  GRAM:       "g",
  KILOGRAM:   "kg",
  MILLILITER: "ml",
  LITER:      "L",
};

interface IngredientFormDialogProps {
  tenantId:     string;
  ingredient?:  Ingredient;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?:   () => void;
}

export function IngredientFormDialog({
  tenantId,
  ingredient,
  open,
  onOpenChange,
  onSuccess,
}: IngredientFormDialogProps) {
  const utils  = trpc.useUtils();
  const isEdit = !!ingredient;

  const create = trpc.ingredient.create.useMutation({
    onSuccess: () => {
      utils.ingredient.getAll.invalidate({ tenantId });
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
  });

  const update = trpc.ingredient.update.useMutation({
    onSuccess: () => {
      utils.ingredient.getAll.invalidate({ tenantId });
      if (ingredient) utils.ingredient.getById.invalidate({ id: ingredient.id, tenantId });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: ingredient
      ? {
          name:           ingredient.name,
          unit:           ingredient.unit as Unit,
          currentStock:   ingredient.currentStock,
          reorderPoint:   ingredient.reorderPoint,
          costPerUnit:    ingredient.costPerUnit ?? undefined,
          wholeUnitsOnly: ingredient.wholeUnitsOnly,
        }
      : {
          unit:           "LB",
          currentStock:   0,
          reorderPoint:   0,
          costPerUnit:    undefined,
          wholeUnitsOnly: false,
        },
  });

  const selectedUnit = (watch("unit") ?? "LB") as Unit;
  const wholeUnitsOnly = watch("wholeUnitsOnly");
  const step = wholeUnitsOnly ? "1" : "0.01";

  const onSubmit = (data: FormValues) => {
    const costPerUnit = data.costPerUnit ?? undefined;
    if (isEdit) {
      // currentStock is intentionally excluded from edit — use Adjust Stock instead
      const { currentStock: _ignored, ...editData } = data;
      update.mutate({ id: ingredient.id, tenantId, ...editData, costPerUnit });
    } else {
      create.mutate({ tenantId, ...data, costPerUnit });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !isEdit) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Bread Flour" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Unit selector — US bakery units + metric */}
          <div className="space-y-1.5">
            <Label>Unit *</Label>
            <Select
              defaultValue={watch("unit")}
              onValueChange={(v) => setValue("unit", v as Unit)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>US Bakery</SelectLabel>
                  {US_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Metric</SelectLabel>
                  {MET_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Whole units only toggle */}
          <div className="flex items-center gap-2">
            <input
              id="wholeUnitsOnly"
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 accent-amber-500"
              {...register("wholeUnitsOnly")}
            />
            <Label htmlFor="wholeUnitsOnly" className="font-normal cursor-pointer">
              Whole numbers only <span className="text-stone-400">(e.g. eggs, rolls, sticks of butter)</span>
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Current stock — only shown when creating; use Adjust Stock to change it after */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step={step}
                  min="0"
                  placeholder="0"
                  {...register("currentStock", { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Low-stock alert threshold */}
            <div className="space-y-1.5">
              <Label htmlFor="reorderPoint">Low Stock Alert At</Label>
              <Input
                id="reorderPoint"
                type="number"
                step={step}
                min="0"
                placeholder="0"
                {...register("reorderPoint", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Nudge to use Adjust Stock when editing */}
          {isEdit && (
            <p className="text-xs text-stone-400 -mt-1">
              To change current stock, use the <strong>Adjust Stock</strong> button on the ingredient page.
            </p>
          )}

          {/* Optional cost per unit — enables dollar waste analytics */}
          <div className="space-y-1.5">
            <Label htmlFor="costPerUnit">
              Cost per {UNIT_ABBR[selectedUnit]}{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
              <Input
                id="costPerUnit"
                type="number"
                step="0.0001"
                min="0"
                placeholder="e.g. 0.89"
                className="pl-7"
                {...register("costPerUnit", {
                  setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
                })}
              />
            </div>
            <p className="text-xs text-stone-400">
              Set this to see dollar cost of waste in analytics
            </p>
            {errors.costPerUnit && (
              <p className="text-xs text-red-600">{errors.costPerUnit.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Ingredient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
