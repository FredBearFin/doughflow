/**
 * TopBar component — the page-level header bar shown on every dashboard page.
 *
 * Renders a horizontal header that spans the full width of the main content
 * area (not the sidebar). It contains:
 *   1. A page title (h1) on the left side — supplied by the parent page
 *   2. An optional slot for action buttons or other controls (right side)
 *      — passed as `children` (e.g. "New Order" or "Edit" buttons)
 *   3. A user avatar (right-most) showing either the user's Google profile
 *      photo or an initials fallback badge
 *
 * The TopBar reads the current session via `useSession` so it can display
 * user information without the parent having to pass it down. This makes it
 * a self-contained Client Component that can be dropped into any page.
 *
 * The height (h-16 = 64px) matches the Sidebar logo section height so both
 * align visually on the same horizontal baseline.
 */

"use client";

import { useSession } from "next-auth/react";

/**
 * Props for the TopBar component.
 *
 * @param title    - The page name displayed as a heading (e.g. "Pantry", "Analytics")
 * @param children - Optional slot for page-specific action elements (buttons, etc.)
 *                   rendered between the title and the user avatar
 */
interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * TopBar renders the fixed page header for all dashboard pages.
 * It is used at the top of each page component directly (not inside a layout)
 * so individual pages can customise their action buttons via children.
 *
 * @param title    - The page heading to display
 * @param children - Optional action elements (e.g. "Add Ingredient" button)
 */
export function TopBar({ title, children }: TopBarProps) {
  // Read the current auth session to display the user's avatar
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6">
      {/* Page title — styled as an h1 but sized for the compact header */}
      <h1 className="text-xl font-semibold text-stone-900">{title}</h1>

      {/* Right-hand area: action slot + user avatar */}
      <div className="flex items-center gap-4">
        {/* Page-specific action buttons injected by the parent page */}
        {children}

        {/* User avatar — only rendered when a session exists */}
        {session?.user && (
          <div className="flex items-center gap-2">
            {session.user.image ? (
              /*
               * If the user signed in via Google, their profile picture is
               * available. We use a plain <img> here (eslint-disable needed
               * because next/image would require a domain whitelist for Google's
               * CDN and adds complexity for a small avatar).
               */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ""}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              /*
               * Fallback: derive an initial from the user's name or email.
               * Takes the first character of name (preferred) or email,
               * uppercased. Falls back to "?" if neither is available.
               */
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-semibold text-sm">
                  {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
