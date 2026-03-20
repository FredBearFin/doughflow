/**
 * Shared utility functions — src/lib/utils.ts
 *
 * This module contains application-wide helper utilities used throughout all
 * components, pages, and server code. It re-exports `formatUnit` from the
 * types module so callers only need to import from one place.
 *
 * Functions exported:
 *   cn            — Merge Tailwind CSS class names safely (clsx + tailwind-merge)
 *   formatCurrency — Format a number as a USD currency string
 *   formatDate     — Format a Date or ISO string into a human-readable date label
 *   formatUnit     — Re-exported from @/types; format a stock quantity with its unit
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Conditionally join and deduplicate Tailwind CSS class names.
 *
 * Combines two utilities:
 *   - clsx: accepts any mix of strings, arrays, and objects (with boolean keys)
 *     and filters out falsy values. Useful for conditional class application:
 *       cn("base", isActive && "active", { "text-red": hasError })
 *   - twMerge: resolves Tailwind conflicts by keeping only the last class when
 *     two classes target the same CSS property (e.g. "p-2 p-4" → "p-4").
 *     Without twMerge, both classes would be in the string and the outcome
 *     depends on stylesheet order — an unpredictable and hard-to-debug issue.
 *
 * This is the standard pattern used by shadcn/ui and Radix-based design systems.
 * It is called in virtually every component in this codebase.
 *
 * @param inputs - Any number of class values (strings, objects, arrays, booleans)
 * @returns      - A single deduplicated, merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatCurrency — Format a number as a USD dollar string.
 *
 * Uses the Intl.NumberFormat API for locale-aware formatting. The "en-US"
 * locale with "currency"/"USD" style produces the canonical "$1,234.56" format
 * expected in the DoughFlow UI (COGS breakdowns, order totals, revenue figures).
 *
 * minimumFractionDigits: 2 ensures whole-dollar amounts are displayed as
 * "$10.00" rather than "$10", which is consistent with financial contexts.
 *
 * @param value - A numeric value in US dollars
 * @returns     - Formatted string, e.g. "$1,234.56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * formatUnit — Re-export from @/types for convenience.
 *
 * Formats a stock quantity with its unit string, with smart unit conversion
 * (e.g. 1500 g → "1.5 kg", 2000 mL → "2 L"). See src/types/index.ts for
 * the full implementation and unit conversion thresholds.
 *
 * Re-exporting here means callers can import all formatting utilities from a
 * single "@/lib/utils" import rather than mixing "@/lib/utils" and "@/types".
 */
export { formatUnit } from "@/types";

/**
 * formatDate — Format a Date object or ISO date string into a short human label.
 *
 * Uses Intl.DateTimeFormat with the "en-US" locale to produce the format:
 *   "Jan 5, 2025" (month: "short", day: "numeric", year: "numeric")
 *
 * The `new Date(date)` wrapping handles both Date objects and ISO string inputs
 * (e.g. dates returned from the database via superjson as ISO strings).
 *
 * Used in:
 *   - Order detail page (expected delivery date, received date)
 *   - Pantry ledger history (entry timestamps)
 *
 * @param date - A Date object or an ISO 8601 date string
 * @returns    - Formatted date string, e.g. "Jan 5, 2025"
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
