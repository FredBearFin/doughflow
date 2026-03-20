/**
 * Button UI component.
 *
 * A fully accessible, touch-friendly button built on Radix UI's Slot
 * primitive and class-variance-authority (cva). Supports:
 *
 * Variants:
 *   default     → amber fill with white text (primary CTA, e.g. "Create Order")
 *   destructive → red fill for dangerous actions (e.g. delete)
 *   outline     → white background with a stone border (secondary actions)
 *   secondary   → light stone fill (alternative secondary)
 *   ghost       → no background, hover reveals stone tint (icon buttons, menus)
 *   link        → amber underline text with no background padding
 *
 * Sizes:
 *   default → h-11 (44px) — minimum recommended touch target per accessibility guidelines
 *   sm      → h-9  (36px) — compact actions in tight spaces (e.g. TopBar actions)
 *   lg      → h-14 (56px) — prominent CTAs or iPad-optimised inputs
 *   icon    → h-11 w-11 (square) — icon-only buttons
 *
 * The `asChild` prop (from Radix Slot) renders the button's children as the
 * root element instead of a <button>. This is useful for rendering a Link as a
 * button without losing accessibility semantics:
 *   <Button asChild><Link href="/somewhere">Go</Link></Button>
 *
 * Accessibility:
 *   - focus-visible:ring-2 ensures a visible focus ring for keyboard users
 *   - disabled:pointer-events-none + disabled:opacity-50 prevents interaction
 *     with and visually dims disabled buttons
 *   - min-h-[44px] on the base ensures the minimum 44px touch target on mobile
 *
 * This is a Client Component ("use client") because it uses React.forwardRef
 * and the Radix Slot which require browser React.
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * buttonVariants defines the base button styles and all variant/size overrides.
 * cva merges these at build time into a single className string.
 */
const buttonVariants = cva(
  // Base styles shared by every button instance
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-4 py-2",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-white hover:bg-amber-600",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-stone-200 bg-white hover:bg-stone-50 text-stone-900",
        secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200",
        ghost: "hover:bg-stone-100 text-stone-900",
        // link variant drops all padding and min-height to behave like an inline text link
        link: "text-amber-600 underline-offset-4 hover:underline p-0 min-h-0",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base",
        icon: "h-11 w-11 p-0",  // Square, no text padding — for icon-only buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * ButtonProps extends the standard button HTML attributes with cva variant
 * props and the `asChild` flag from Radix Slot.
 *
 * @param asChild - When true, renders children as the root element (via Slot)
 *                  instead of a <button>. Useful for composing with Link.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button renders a styled, accessible button element.
 * Uses React.forwardRef so the component can be composed with other Radix
 * primitives that pass refs down the component tree.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    /*
     * When asChild is true, Slot merges its props onto the single child element.
     * When asChild is false, a standard <button> element is rendered.
     */
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
