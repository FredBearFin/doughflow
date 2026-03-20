/**
 * Dialog UI components.
 *
 * A set of accessible modal dialog primitives built on top of Radix UI's
 * Dialog primitive (@radix-ui/react-dialog). Radix handles all the hard parts:
 *   - Focus trapping (keyboard focus stays inside the dialog while open)
 *   - Escape key to close
 *   - aria-modal and role="dialog" attributes for screen readers
 *   - Scroll lock on the body when the dialog is open
 *
 * Component structure:
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTrigger>Open</DialogTrigger>       — optional trigger button
 *     <DialogContent>                            — the modal panel
 *       <DialogHeader>
 *         <DialogTitle>Title</DialogTitle>
 *         <DialogDescription>Sub-text</DialogDescription>
 *       </DialogHeader>
 *       …body content…
 *     </DialogContent>
 *   </Dialog>
 *
 * Design decisions:
 *   - DialogOverlay: semi-transparent black backdrop with blur for depth
 *   - DialogContent: centred on screen, max-w-lg, rounded-xl with shadow-xl
 *   - A close button (×) is automatically rendered in the top-right corner
 *     of every DialogContent using Radix's Close primitive
 *   - Animations: Tailwind's data-[state=open/closed] animation classes handle
 *     the fade-in/out without needing manual state transitions
 *
 * This is a Client Component ("use client") because Radix primitives use
 * browser APIs and React context.
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Re-export the Radix root components under friendlier names */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay — the semi-transparent backdrop that sits beneath the dialog panel.
 * Rendered via a React portal so it covers the full viewport regardless of where
 * the Dialog component is placed in the DOM tree.
 *
 * backdrop-blur-sm provides a subtle depth effect that draws the eye to the dialog.
 * data-[state=open/closed] classes trigger Tailwind's animate-in/animate-out
 * utilities for a smooth fade transition.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent — the white modal panel rendered above the overlay.
 * Composed using DialogPortal (teleports to document.body) and DialogOverlay
 * (the backdrop) so both are always present when content is open.
 *
 * Positioning: fixed, centred using left-[50%] + translate-x-[-50%] pattern
 * (equivalent to left:50%, transform:translateX(-50%)) which works correctly
 * even with nested scroll contexts.
 *
 * The auto-inserted close (×) button uses Radix's Close primitive so it
 * inherits all the accessibility behaviour (aria-label, keyboard activation).
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border border-stone-200 bg-white p-6 shadow-xl",
        className
      )}
      {...props}
    >
      {children}
      {/* Auto-rendered close button in the top-right corner */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogHeader — a flex column container for the title and description.
 * mb-4 ensures consistent spacing below the header before the form/content.
 * This is a plain functional component (no forwardRef) because no ref is needed.
 */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />
);

/**
 * DialogTitle — the primary heading of the dialog.
 * Rendered as the Radix Title so it is automatically referenced by aria-labelledby
 * on the dialog panel for screen reader compatibility.
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-stone-900", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription — secondary descriptive text beneath the title.
 * Rendered as the Radix Description so it is automatically referenced by
 * aria-describedby on the dialog panel for screen readers.
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-stone-500", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
