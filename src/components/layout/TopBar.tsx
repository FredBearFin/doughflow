"use client";

/**
 * TopBar — the page-level header bar shown on every dashboard page.
 *
 * - Page title (h1) on the left
 * - Optional action slot (right of title)
 * - User avatar (rightmost)
 * - Hamburger for mobile sidebar trigger
 */

import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export function TopBar({ title, children }: TopBarProps) {
  const { data: session } = useSession();
  const { setOpen } = useSidebar();

  return (
    <header
      className="flex h-16 items-center justify-between px-4 md:px-6 border-b border-stone-200/80 bg-white/90 sticky top-0 z-30"
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="md:hidden flex-shrink-0 p-2 -ml-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-stone-900 truncate">{title}</h1>
      </div>

      {/* Right: action slot + avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {children}

        {session?.user && (
          session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="h-8 w-8 rounded-full ring-2 ring-amber-100 ring-offset-1 shadow-sm"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm ring-2 ring-amber-100 ring-offset-1"
              style={{ background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)" }}
            >
              <span className="text-white font-bold text-sm">
                {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
              </span>
            </div>
          )
        )}
      </div>
    </header>
  );
}
