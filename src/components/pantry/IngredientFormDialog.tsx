"use client";

// IngredientFormDialog — create or edit a pantry ingredient.
// Simplified: just name, unit, current stock, and low-stock alert threshold.

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const schema = z.object({
  name:         z.string().min(1, "Name required"),
  unit:         z.enum(["GRAM", "KILOGRAM", "MILLILITER", "LITER", "EACH"]),
  currentStock: z.number().min(0),
  reorderPoint: z.number().min(0), // Low-stock alert threshold
});

type FormValues = z.infer<typeof schema>;

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
          name:         ingredient.name,
          unit:         ingredient.unit as FormValues["unit"],
          currentStock: ingredient.currentStock,
          reorderPoint: ingredient.reorderPoint,
        }
      : {
          unit:         "GRAM",
          currentStock: 0,
          reorderPoint: 0,
        },
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
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Bread Flour" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Unit selector */}
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
                <SelectItem value="GRAM">Gram</SelectItem>
                <SelectItem value="KILOGRAM">Kilogram</SelectItem>
                <SelectItem value="MILLILITER">Milliliter</SelectItem>
                <SelectItem value="LITER">Liter</SelectItem>
                <SelectItem value="EACH">Each</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Current stock — opening balance in create mode */}
            <div className="space-y-1.5">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                placeholder="0"
                {...register("currentStock", { valueAsNumber: true })}
              />
            </div>

            {/* Low-stock alert threshold */}
            <div className="space-y-1.5">
              <Label htmlFor="reorderPoint">Low Stock Alert At</Label>
              <Input
                id="reorderPoint"
                type="number"
                step="0.01"
                placeholder="0"
                {...register("reorderPoint", { valueAsNumber: true })}
              />
            </div>
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
