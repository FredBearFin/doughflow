/**
 * Input UI component.
 *
 * A styled wrapper around the native HTML <input> element. Provides consistent
 * visual styling across all form inputs in DoughFlow:
 *   - Height: h-11 (44px) — meets the minimum touch target size recommendation
 *   - Border: stone-200 to match the warm neutral palette
 *   - Focus ring: amber-500 (brand colour) — visible for keyboard/accessibility
 *   - Placeholder: stone-400 for a soft, non-intrusive hint colour
 *   - File input styles: reset file:border-0 and file:bg-transparent so the
 *     native file button doesn't look out of place
 *   - Disabled state: muted cursor and reduced opacity
 *
 * The component uses React.forwardRef so parent components and libraries
 * (like react-hook-form's register()) can attach a ref to the underlying
 * <input> element without wrapping it manually.
 *
 * All standard HTMLInputElement attributes are accepted and forwarded,
 * including type, placeholder, value, onChange, disabled, step, min, max, etc.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * InputProps extends all standard HTML input attributes.
 * No additional custom props are needed — the component is a styled native input.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input renders a styled <input> element.
 * Accepts all standard input attributes; className can be used to override
 * or extend styles (e.g. `className="h-14"` for the large waste-log inputs).
 *
 * @param className - Additional Tailwind classes merged with the base styles
 * @param type      - The input type (text, number, email, date, etc.)
 * @param ref       - Forwarded ref for react-hook-form and other ref consumers
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles: sized, rounded, bordered, with focus ring
          "flex h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
