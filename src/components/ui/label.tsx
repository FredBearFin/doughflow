/**
 * Label UI component.
 *
 * A styled wrapper around Radix UI's Label primitive (@radix-ui/react-label).
 * Using Radix's Label rather than a plain <label> provides:
 *   - Automatic association with the labelled input via htmlFor/id
 *   - Correct peer-disabled cursor handling (cursor-not-allowed when the
 *     paired input is disabled)
 *
 * Styles:
 *   - text-sm font-medium: small but legible, medium weight so it reads
 *     above the input without competing with it
 *   - text-stone-700: warm dark neutral — slightly softer than pure black
 *   - leading-none: tight line-height prevents extra vertical space when the
 *     label is stacked above an input in a space-y-1.5 container
 *   - peer-disabled:*: automatically dims and changes cursor when the
 *     corresponding input is disabled (using Tailwind's peer modifier)
 *
 * Used on every form in the application (IngredientFormDialog, RecipeFormDialog,
 * AdjustStockDialog, OrderFormDialog, WastePage, SuppliersPage, etc.).
 *
 * This is a Client Component ("use client") because Radix Label uses
 * browser DOM APIs internally.
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/**
 * Label renders a styled, accessible form label.
 * Accepts all standard label HTML attributes (htmlFor, children, className).
 * Uses React.forwardRef so it can be composed with Radix form primitives.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-stone-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
