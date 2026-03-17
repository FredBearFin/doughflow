import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        ok: "bg-green-100 text-green-800",
        low: "bg-amber-100 text-amber-800",
        critical: "bg-red-100 text-red-800",
        pending: "bg-indigo-100 text-indigo-800",
        default: "bg-stone-100 text-stone-800",
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
