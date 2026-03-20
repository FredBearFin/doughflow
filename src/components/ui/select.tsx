/**
 * Select UI components.
 *
 * A fully accessible, keyboard-navigable custom dropdown built on Radix UI's
 * Select primitive (@radix-ui/react-select). Radix handles:
 *   - Keyboard navigation (arrow keys, Home/End, type-ahead)
 *   - Focus management (closes on Escape, returns focus to trigger)
 *   - ARIA attributes (role="listbox", aria-selected, aria-disabled)
 *   - Scroll into view for the selected item when the dropdown opens
 *
 * Component structure:
 *   <Select value={val} onValueChange={setVal}>
 *     <SelectTrigger>            — the visible button that opens the dropdown
 *       <SelectValue />          — displays the currently selected option text
 *     </SelectTrigger>
 *     <SelectContent>            — the dropdown panel (portalled to document.body)
 *       <SelectItem value="a">Option A</SelectItem>
 *       <SelectItem value="b">Option B</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * Also exported but not yet used in every form:
 *   SelectGroup   — groups related options
 *   SelectLabel   — a non-selectable heading within a group
 *
 * Design:
 *   - SelectTrigger: matches the Input component's height (h-11) and border
 *     style for visual consistency across form controls
 *   - SelectContent: elevated with shadow-md, rendered in a portal so it always
 *     appears above other page elements regardless of stacking context
 *   - SelectItem: highlighted with amber-50 on focus/keyboard selection
 *     (consistent with the brand focus colour used elsewhere)
 *   - A check mark indicator (SelectPrimitive.ItemIndicator) is rendered to the
 *     left of the selected option when the dropdown is open
 *
 * This is a Client Component ("use client") because Radix uses browser APIs
 * and React context for dropdown state management.
 */

"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Re-export the un-styled Radix root, group, and value primitives */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

/**
 * SelectTrigger — the visible button that opens the dropdown.
 * Styled to match the Input component for consistency: h-11, stone border,
 * amber focus ring. A chevron icon is appended via Radix's Icon slot.
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    {/* Chevron icon — indicates the trigger is a dropdown */}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * SelectContent — the dropdown panel rendered as a portal.
 * Using a portal ensures the dropdown appears above all other page elements
 * regardless of the CSS stacking context (z-index, overflow hidden, etc.).
 * SelectPrimitive.Viewport wraps the items and handles scroll behaviour.
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-md",
        className
      )}
      position={position}
      {...props}
    >
      {/* Viewport adds 4px padding around the items list */}
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * SelectItem — a single selectable option within the dropdown.
 * Uses Radix's ItemIndicator to conditionally render a check mark next to
 * the currently selected option when the list is open.
 * Amber focus highlight (focus:bg-amber-50) matches the brand colour scheme.
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // pl-8 reserves space on the left for the check mark indicator
      "relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none focus:bg-amber-50 focus:text-amber-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {/* Check mark — only visible for the currently selected item */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    {/* ItemText is what Radix reads for the displayed value and accessibility */}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * SelectLabel — a non-selectable group heading within a SelectGroup.
 * Indented to align with SelectItem text (pl-8).
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-stone-500", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel };
