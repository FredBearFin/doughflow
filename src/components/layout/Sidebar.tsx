"use client";

// Sidebar navigation — fixed left panel shown on all dashboard pages.

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
  Database,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useTier } from "@/hooks/useTier";

const nav = [
  { href: "/overview",  label: "Today's Kitchen",  icon: LayoutDashboard },
  { href: "/bake",      label: "Bake Plan",         icon: ChefHat },
  { href: "/pantry",    label: "Pantry",             icon: Package },
  { href: "/recipes",   label: "Products",           icon: UtensilsCrossed },
  { href: "/waste",     label: "End of Day",         icon: ClipboardList },
  { href: "/events",    label: "Event Overrides",    icon: CalendarDays },
  { href: "/data",      label: "Import / Export",    icon: Database },
  { href: "/settings",  label: "Settings",           icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const { tier, isLoading, hasWaste, isTrialing, trialDaysLeft } = useTier();
  const isTopTier = tier === "PAID" && !isTrialing;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          // Base layout
          "flex h-screen w-60 flex-col",
          // Visual treatment — subtle gradient + right shadow
          "border-r border-stone-200/80",
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
          // Desktop: static in flow
          "md:relative md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)",
          boxShadow: "1px 0 0 0 rgba(0,0,0,0.06), 4px 0 16px -4px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Logo ────────────────────────────────────────────────── */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-stone-100">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            <span className="text-white font-black text-sm leading-none">D</span>
          </div>
          <span className="font-bold text-stone-900 text-[17px] tracking-tight">DoughFlow</span>
        </div>

        {/* ── Nav links ───────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {nav.map(({ href, label, icon: Icon }) => {
            if (href === "/waste" && !isLoading && !hasWaste) return null;

            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5",
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-500 hover:bg-stone-100/80 hover:text-stone-800"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ background: "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)" }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-amber-500" : "text-stone-400 group-hover:text-stone-600"
                  )}
                />
                <span className={active ? "font-semibold" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Plan badge ──────────────────────────────────────────── */}
        {!isLoading && (
          <div className="px-2.5 pt-2 pb-1 border-t border-stone-100">
            {isTopTier ? (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-700"
                style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                Pro Plan — Fully Unlocked
              </div>
            ) : isTrialing ? (
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm group"
                style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}
              >
                <div>
                  <p className="text-xs font-bold text-amber-800">Free Trial</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                    {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left · Upgrade →
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 group-hover:rotate-12 transition-transform duration-200" />
              </Link>
            ) : (
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm group"
                style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}
              >
                <div>
                  <p className="text-xs font-bold text-amber-800">Free Plan</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Upgrade to Pro →</p>
                </div>
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 group-hover:rotate-12 transition-transform duration-200" />
              </Link>
            )}
          </div>
        )}

        {/* ── Sign out ────────────────────────────────────────────── */}
        <div className="p-2.5 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors group"
          >
            <LogOut className="h-4 w-4 group-hover:text-stone-500 transition-colors" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
