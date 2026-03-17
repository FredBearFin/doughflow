"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Ingredient } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatUnit } from "@/types";

const schema = z.object({
  qty: z.number(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AdjustStockDialogProps {
  ingredient: Ingredient;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdjustStockDialog({
  ingredient,
  tenantId,
  open,
  onOpenChange,
  onSuccess,
}: AdjustStockDialogProps) {
  const utils = trpc.useUtils();
  const adjust = trpc.ingredient.adjust.useMutation({
    onSuccess: () => {
      utils.ingredient.getAll.invalidate({ tenantId });
      utils.ingredient.getById.invalidate({ id: ingredient.id, tenantId });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    adjust.mutate({
      ingredientId: ingredient.id,
      tenantId,
      qty: data.qty,
      reason: "ADJUSTMENT",
      note: data.note,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {ingredient.name}</DialogTitle>
          <DialogDescription>
            Current stock: {formatUnit(ingredient.currentStock, ingredient.unit)}. Enter a
            positive number to add stock, negative to remove.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qty">
              Adjustment ({ingredient.unit.toLowerCase()})
            </Label>
            <Input
              id="qty"
              type="number"
              step="0.01"
              placeholder="e.g. 5000 or -200"
              {...register("qty", { valueAsNumber: true })}
            />
            {errors.qty && <p className="text-xs text-red-600">{errors.qty.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" placeholder="e.g. Delivery received" {...register("note")} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? "Saving…" : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
