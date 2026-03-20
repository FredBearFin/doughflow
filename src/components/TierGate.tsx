"use client";

import Link from "next/link";
import { Lock, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TierGateProps {
  /**
   * When true, children render normally.
   * When false, shows blurred preview + lock overlay.
   */
  allowed: boolean;
  /**
   * While the tier is still resolving don't flash the lock — render
   * children as-is until we know for sure the user is gated.
   */
  isLoading?: boolean;
  /** Real content — shown normally when allowed. */
  children: React.ReactNode;
  /**
   * Content shown BLURRED when locked.
   * Pass fake/placeholder content so every free user sees a compelling
   * preview even before they have real data.
   * Defaults to children if omitted.
   */
  preview?: React.ReactNode;
  /** Lock card headline */
  title?: string;
  /** Lock card sub-text */
  description?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA destination — defaults to /pricing */
  ctaHref?: string;
  /** Fine print below the CTA */
  finePrint?: string;
}

export function TierGate({
  allowed,
  isLoading = false,
  children,
  preview,
  title = "Unlock your Bake Plan",
  description = "See exactly how much to bake this weekend based on your real sales history.",
  ctaLabel = "Unlock to see how much to bake this weekend →",
  ctaHref = "/pricing",
  finePrint = "Available on Cottage ($6/mo) and above · Free forever for basic tracking",
}: TierGateProps) {
  // While resolving, or when allowed, render normally — no flash of lock.
  if (isLoading || allowed) return <>{children}</>;

  return (
    <div className="relative">
      {/* ── Blurred preview ─────────────────────────────────────────────── */}
      <div
        className="blur-sm pointer-events-none select-none opacity-60"
        aria-hidden="true"
      >
        {preview ?? children}
      </div>

      {/* ── Lock overlay ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1.5px]">
        <div className="mx-4 w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-7 shadow-2xl shadow-amber-100/60 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
            <Lock className="h-5 w-5 text-amber-500" />
          </div>

          <h3 className="text-base font-semibold text-stone-900 mb-1.5">{title}</h3>
          <p className="text-sm text-stone-500 leading-relaxed mb-5">{description}</p>

          <Button
            asChild
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md shadow-amber-200"
          >
            <Link href={ctaHref}>
              <ChefHat className="h-4 w-4 mr-1.5 shrink-0" />
              {ctaLabel}
            </Link>
          </Button>

          {finePrint && (
            <p className="text-[11px] text-stone-400 mt-3 leading-snug">{finePrint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
