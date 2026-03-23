"use client";

// Sidebar navigation — fixed left panel shown on all dashboard pages.
// Uses usePathname for active state detection (client-side hook).

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ClipboardList,
  CalendarDays,
  Settings,
  LogOut,
  ChefHat,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

// Core navigation items — lean set matching the app's focused scope
const nav = [
  { href: "/overview",  label: "Today's Kitchen", icon: LayoutDashboard },
  { href: "/bake",      label: "Bake Plan",        icon: ChefHat },
  { href: "/pantry",    label: "Pantry",           icon: Package },
  { href: "/recipes",   label: "Products",         icon: UtensilsCrossed },
  { href: "/waste",     label: "End of Day",       icon: ClipboardList },
  { href: "/events",    label: "Event Overrides",  icon: CalendarDays },
  { href: "/settings",  label: "Settings",         icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

    <aside className={cn(
      "flex h-screen w-60 flex-col border-r border-stone-200 bg-white",
      // Mobile: fixed overlay drawer, slides in from left
      "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
      // Desktop: static sidebar in normal flow
      "md:relative md:z-auto md:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-stone-100">
        <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-semibold text-stone-900 text-lg">DoughFlow</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          // Prefix matching so child routes keep the parent item highlighted
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5",
                active
                  ? "bg-amber-50 text-amber-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-stone-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
