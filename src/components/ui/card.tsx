/**
 * Card UI components.
 *
 * A set of composable card primitives used throughout DoughFlow to group
 * related content in a visually distinct, rounded white panel with a subtle
 * border and shadow. The components follow a compound-component pattern:
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Section Title</CardTitle>
 *       <CardDescription>Optional sub-text</CardDescription>
 *     </CardHeader>
 *     <CardContent>…main body…</CardContent>
 *     <CardFooter>…footer actions…</CardFooter>
 *   </Card>
 *
 * Each sub-component is a React.forwardRef wrapper around a plain <div>
 * (or <p> for text elements) so that they can accept refs and all standard
 * HTML attributes. className merging is handled by the `cn` utility so
 * callers can override or extend styles without fighting specificity.
 *
 * Style decisions:
 *   - rounded-xl (12px radius) matches the design system's rounded aesthetic
 *   - border-stone-200 is used instead of gray for the warm stone colour palette
 *   - shadow-sm is intentionally subtle to keep cards lightweight visually
 *   - p-6 is the default padding; individual page usages often override with p-4 or p-5
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — the outer container with border, background, and shadow.
 * Accepts any standard div props including className for style overrides.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-stone-200 bg-white shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/**
 * CardHeader — a flex column container for the title and description.
 * Uses pb-4 so the content below (CardContent) doesn't double-up on padding.
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-6 pb-4", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

/**
 * CardTitle — the primary heading inside a card.
 * Renders as an <h3> for correct document outline semantics.
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-stone-900", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

/**
 * CardDescription — secondary descriptive text beneath the title.
 * Renders as a <p> element with muted stone-500 colour.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-stone-500", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent — the main body area of the card.
 * Uses pt-0 because the CardHeader above already provides bottom padding,
 * preventing a double gap between the header and content.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

/**
 * CardFooter — a flex row container for footer actions (e.g. buttons).
 * Aligns items to the center vertically and matches the horizontal padding of
 * the card header and content.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
