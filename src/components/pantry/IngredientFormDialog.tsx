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

const schema = z.object({
  name: z.string().min(1, "Name required"),
  unit: z.enum(["LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH", "GRAM", "KILOGRAM", "MILLILITER", "LITER"]),
  currentStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQty: z.number().min(0),
  leadTimeDays: z.number().int().min(0),
  costPerUnit: z.number().min(0),
  sku: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface IngredientFormDialogProps {
  tenantId: string;
  ingredient?: Ingredient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IngredientFormDialog({
  tenantId,
  ingredient,
  open,
  onOpenChange,
  onSuccess,
}: IngredientFormDialogProps) {
  const utils = trpc.useUtils();
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: ingredient
      ? {
          name: ingredient.name,
          unit: ingredient.unit as FormValues["unit"],
          currentStock: ingredient.currentStock,
          reorderPoint: ingredient.reorderPoint,
          reorderQty: ingredient.reorderQty,
          leadTimeDays: ingredient.leadTimeDays,
          costPerUnit: ingredient.costPerUnit,
          sku: ingredient.sku ?? undefined,
        }
      : { unit: "LB", currentStock: 0, reorderPoint: 0, reorderQty: 0, leadTimeDays: 3, costPerUnit: 0 },
  });

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      update.mutate({ id: ingredient.id, tenantId, ...data });
    } else {
      create.mutate({ tenantId, ...data });
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
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Bread Flour" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Unit *</Label>
              <Select
                defaultValue={watch("unit")}
                onValueChange={(v) => setValue("unit", v as FormValues["unit"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>US Bakery</SelectLabel>
                    <SelectItem value="LB">Pound (lb)</SelectItem>
                    <SelectItem value="OZ">Ounce (oz)</SelectItem>
                    <SelectItem value="FL_OZ">Fluid Ounce (fl oz)</SelectItem>
                    <SelectItem value="CUP">Cup</SelectItem>
                    <SelectItem value="TBSP">Tablespoon (tbsp)</SelectItem>
                    <SelectItem value="TSP">Teaspoon (tsp)</SelectItem>
                    <SelectItem value="EACH">Each</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Metric</SelectLabel>
                    <SelectItem value="GRAM">Gram (g)</SelectItem>
                    <SelectItem value="KILOGRAM">Kilogram (kg)</SelectItem>
                    <SelectItem value="MILLILITER">Milliliter (ml)</SelectItem>
                    <SelectItem value="LITER">Liter (L)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="BF-001" {...register("sku")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                {...register("currentStock", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costPerUnit">Cost per Unit ($)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.0001"
                {...register("costPerUnit", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                step="0.01"
                {...register("reorderPoint", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reorderQty">Reorder Quantity</Label>
              <Input
                id="reorderQty"
                type="number"
                step="0.01"
                {...register("reorderQty", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                {...register("leadTimeDays", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Ingredient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
