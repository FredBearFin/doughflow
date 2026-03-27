"use client";

/**
 * TrialBanner — shown at the top of every dashboard page while the user is
 * on their 6-week free trial. Urgency colour shifts as the trial winds down:
 *
 * > 14 days → neutral stone banner (low pressure)
 * 7–14 days → amber banner ("trial ending soon")
 * ≤ 7 days  → red banner ("trial ending this week")
 */

import Link from "next/link";
import { useTier } from "@/hooks/useTier";
import { Clock, ArrowRight, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { isTrialing, trialDaysLeft, isLoading } = useTier();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !isTrialing || dismissed) return null;

  const isUrgent  = trialDaysLeft <= 7;
  const isWarning = trialDaysLeft > 7 && trialDaysLeft <= 14;

  const dayLabel = trialDaysLeft === 1 ? "1 day" : `${trialDaysLeft} days`;

  const headline = isUrgent
    ? `Trial ends in ${dayLabel} — don't lose access`
    : isWarning
    ? `Your free trial ends in ${dayLabel}`
    : `Free trial active — ${dayLabel} remaining`;

  // ── Urgency-keyed visual tokens ────────────────────────────────────────────
  const bannerBg = isUrgent
    ? "linear-gradient(90deg, #FEF2F2 0%, #FFF5F5 100%)"
    : isWarning
    ? "linear-gradient(90deg, #FFFBEB 0%, #FEF9EC 100%)"
    : "linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)";

  const borderColor = isUrgent ? "#FECACA" : isWarning ? "#FDE68A" : "#E5E7EB";

  const iconColor = isUrgent ? "text-red-500" : isWarning ? "text-amber-500" : "text-stone-400";

  const textColor = isUrgent ? "text-red-800" : isWarning ? "text-amber-800" : "text-stone-600";

  const subColor = isUrgent ? "text-red-500" : isWarning ? "text-amber-600" : "text-stone-400";

  const ctaBg = isUrgent
    ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
    : isWarning
    ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
    : "linear-gradient(135deg, #374151 0%, #1F2937 100%)";

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm border-b"
      style={{ background: bannerBg, borderColor }}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Clock className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
        <span className={`font-semibold truncate ${textColor}`}>{headline}</span>
        {(isUrgent || isWarning) && (
          <span className={`hidden sm:inline text-xs font-medium ${subColor} shrink-0`}>
            · Bake Plan &amp; analytics disappear when it ends
          </span>
        )}
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3.5 text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px active:scale-95"
          style={{ background: ctaBg }}
        >
          Upgrade to Pro — $9/mo
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className={`p-1.5 rounded-lg transition-colors ${
            isUrgent
              ? "text-red-300 hover:bg-red-100 hover:text-red-500"
              : isWarning
              ? "text-amber-300 hover:bg-amber-100 hover:text-amber-600"
              : "text-stone-300 hover:bg-stone-200 hover:text-stone-500"
          }`}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
