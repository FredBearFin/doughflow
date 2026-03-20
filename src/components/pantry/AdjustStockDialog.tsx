/**
 * AdjustStockDialog — modal dialog for applying a manual stock adjustment to a
 * single ingredient.
 *
 * Used from the pantry ingredient detail page (/pantry/[id]) when a staff member
 * needs to correct the stock level without triggering a purchase order or waste
 * event. Typical use cases:
 *   - Recording a physical stocktake discrepancy
 *   - Adding stock received outside of the normal PO workflow
 *   - Removing damaged goods that were not logged as waste
 *
 * The adjustment quantity is a signed number:
 *   - Positive → adds stock (e.g. +500 grams)
 *   - Negative → removes stock (e.g. -200 grams)
 *
 * On the server, the `ingredient.adjust` mutation:
 *   1. Increments ingredient.currentStock by the signed qty (Prisma atomic)
 *   2. Creates an InventoryLedger entry with reason "ADJUSTMENT"
 *
 * Both operations happen in a Prisma transaction so the ledger and stock level
 * stay consistent even under concurrent requests.
 *
 * This is a Client Component ("use client") because it manages form state and
 * calls a tRPC mutation.
 */

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

/**
 * Zod schema for the stock adjustment form.
 * - qty: any number (positive or negative); no min constraint because
 *   the user can deliberately remove stock with a negative value
 * - note: optional free text to explain the reason for the adjustment
 */
const schema = z.object({
  qty: z.number(),
  note: z.string().optional(),
});

/** Inferred TypeScript type matching the Zod schema */
type FormValues = z.infer<typeof schema>;

/**
 * Props for AdjustStockDialog.
 *
 * @param ingredient   - The Prisma Ingredient record being adjusted; provides
 *                       the name, unit, and current stock for display
 * @param tenantId     - Tenant scope required by the mutation
 * @param open         - Controls whether the dialog is visible
 * @param onOpenChange - Callback to open/close the dialog
 * @param onSuccess    - Optional callback fired after a successful adjustment
 */
interface AdjustStockDialogProps {
  ingredient: Ingredient;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * AdjustStockDialog renders the stock adjustment modal for a given ingredient.
 * After a successful submission the ingredient detail and list queries are
 * invalidated so the UI reflects the updated stock immediately.
 */
export function AdjustStockDialog({
  ingredient,
  tenantId,
  open,
  onOpenChange,
  onSuccess,
}: AdjustStockDialogProps) {
  // tRPC query cache utilities for manual invalidation
  const utils = trpc.useUtils();

  /**
   * Adjust mutation — applies the signed stock delta and records a ledger entry.
   * On success: refreshes both the list and detail queries, closes the dialog,
   * and optionally fires the parent's onSuccess callback.
   */
  const adjust = trpc.ingredient.adjust.useMutation({
    onSuccess: () => {
      // Refresh the pantry list so the card shows the new stock level
      utils.ingredient.getAll.invalidate({ tenantId });
      // Refresh the detail page so the ledger history shows the new entry
      utils.ingredient.getById.invalidate({ id: ingredient.id, tenantId });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  // react-hook-form instance wired to the Zod schema
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /**
   * Form submission handler.
   * The reason is always "ADJUSTMENT" for manually entered corrections.
   * The server distinguishes this from PURCHASE, PRODUCTION, WASTE, and OPENING.
   */
  const onSubmit = (data: FormValues) => {
    adjust.mutate({
      ingredientId: ingredient.id,
      tenantId,
      qty: data.qty,
      note: data.note,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        // Reset the form fields when the dialog is closed so stale values
        // are not shown if the dialog is reopened
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {ingredient.name}</DialogTitle>
          {/* Contextual description tells the user the current stock so they
              can decide what delta to enter (e.g. after a physical count) */}
          <DialogDescription>
            Current stock: {formatUnit(ingredient.currentStock, ingredient.unit)}. Enter a
            positive number to add stock, negative to remove.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Adjustment quantity — signed number input */}
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

          {/* Optional note — stored in the ledger entry for audit purposes */}
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
            {/* Disabled while the mutation is in flight to prevent double-submission */}
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? "Saving…" : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
