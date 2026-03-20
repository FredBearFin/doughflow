/**
 * Badge UI component.
 *
 * A small inline label used to communicate status at a glance. Built with
 * class-variance-authority (cva) so multiple visual variants can be expressed
 * as a single component with a `variant` prop rather than separate components
 * or ad-hoc className strings.
 *
 * DoughFlow-specific variants:
 *
 * Stock status variants (used by StockBadge and IngredientCard):
 *   ok       → green background — ingredient is well stocked
 *   low      → amber background — approaching the reorder threshold
 *   critical → red background   — at or below 50% of the reorder threshold
 *
 * Purchase order status variants (used by order list and detail pages):
 *   draft     → stone (neutral)  — PO has been created but not sent
 *   sent      → indigo           — PO has been sent to the supplier
 *   confirmed → blue             — supplier has acknowledged the order
 *   received  → green            — goods have been received and stock updated
 *   cancelled → red/muted        — PO was cancelled
 *
 * General variants:
 *   pending   → indigo (generic "awaiting action" state)
 *   default   → stone  (fallback for unknown statuses)
 *
 * Usage:
 *   <Badge variant="ok">In Stock</Badge>
 *   <Badge variant="draft">Draft</Badge>
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * badgeVariants defines the base styles shared by all badges and the
 * per-variant colour overrides. The base class ensures consistent sizing,
 * font weight, and rounded pill shape regardless of variant.
 */
const badgeVariants = cva(
  // Base styles applied to every badge instance
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // Stock status variants
        ok: "bg-green-100 text-green-800",
        low: "bg-amber-100 text-amber-800",
        critical: "bg-red-100 text-red-800",
        // Generic variants
        pending: "bg-indigo-100 text-indigo-800",
        default: "bg-stone-100 text-stone-800",
        // Purchase order lifecycle variants
        draft: "bg-stone-100 text-stone-600",
        sent: "bg-indigo-100 text-indigo-800",
        confirmed: "bg-blue-100 text-blue-800",
        received: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

/**
 * BadgeProps extends the standard div HTML attributes with the cva variant
 * prop so TypeScript can type-check variant values at compile time.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge renders a small coloured label.
 *
 * @param className - Additional Tailwind classes to merge with the variant styles
 * @param variant   - The visual style variant (see above for options)
 * @param props     - Standard div HTML attributes (children, onClick, etc.)
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
