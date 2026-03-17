"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  supplierId: z.string().min(1, "Select supplier"),
  expectedAt: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      ingredientId: z.string().min(1),
      qty: z.number().min(0.01),
      unitCost: z.number().min(0),
    })
  ).min(1, "Add at least one line"),
});

type FormValues = z.infer<typeof schema>;

interface OrderFormDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OrderFormDialog({ tenantId, open, onOpenChange, onSuccess }: OrderFormDialogProps) {
  const utils = trpc.useUtils();

  const { data: suppliers } = trpc.analytics.supplier.useQuery({ tenantId });
  const { data: ingredients } = trpc.ingredient.getAll.useQuery({ tenantId });

  const create = trpc.order.create.useMutation({
    onSuccess: () => {
      utils.order.getAll.invalidate({ tenantId });
      onOpenChange(false);
      reset();
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
      lines: [{ ingredientId: "", qty: 0, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const onSubmit = (data: FormValues) => {
    create.mutate({ tenantId, ...data });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Supplier *</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                {...register("supplierId")}
              >
                <option value="">Select supplier…</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-red-600">{errors.supplierId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedAt">Expected Delivery</Label>
              <Input id="expectedAt" type="date" {...register("expectedAt")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Optional notes" {...register("notes")} />
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <Label>Order Lines</Label>
            <div className="text-xs text-stone-400 grid grid-cols-[1fr_80px_80px_36px] gap-2 px-1">
              <span>Ingredient</span>
              <span>Qty</span>
              <span>Unit Cost</span>
              <span />
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center">
                <select
                  className="flex h-11 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  {...register(`lines.${idx}.ingredientId`)}
                >
                  <option value="">Select…</option>
                  {ingredients?.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="px-2"
                  {...register(`lines.${idx}.qty`, { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="0.00"
                  className="px-2"
                  {...register(`lines.${idx}.unitCost`, { valueAsNumber: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-stone-400 hover:text-red-500 h-11 w-9"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ingredientId: "", qty: 0, unitCost: 0 })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line
            </Button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
