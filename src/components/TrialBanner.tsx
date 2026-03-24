"use client";

/**
 * TrialBanner — shown at the top of every dashboard page while the user is
 * on their 6-week free trial. Urgency colour shifts as the trial winds down:
 *
 *   > 14 days  →  neutral stone banner (low pressure)
 *   7–14 days  →  amber banner ("trial ending soon")
 *   ≤ 7 days   →  red banner ("trial ending this week")
 */

import Link from "next/link";
import { useTier } from "@/hooks/useTier";
import { Clock, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { isTrialing, trialDaysLeft, isLoading } = useTier();
  const [dismissed, setDismissed] = useState(false);

  // Don't flash during load or after user dismisses for this session
  if (isLoading || !isTrialing || dismissed) return null;

  // ── Urgency level ─────────────────────────────────────────────────────────
  const isUrgent  = trialDaysLeft <= 7;
  const isWarning = trialDaysLeft > 7 && trialDaysLeft <= 14;
  // else: comfortable (> 14 days)

  const dayLabel = trialDaysLeft === 1 ? "1 day" : `${trialDaysLeft} days`;

  const bannerCn = isUrgent
    ? "bg-red-50   border-red-200   text-red-800"
    : isWarning
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-stone-50 border-stone-200 text-stone-700";

  const iconCn = isUrgent
    ? "text-red-500"
    : isWarning
    ? "text-amber-500"
    : "text-stone-400";

  const ctaCn = isUrgent
    ? "bg-red-600   hover:bg-red-700   text-white"
    : isWarning
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-stone-800 hover:bg-stone-900 text-white";

  const headline = isUrgent
    ? `Your free trial ends in ${dayLabel} — don't lose access`
    : isWarning
    ? `Your free trial ends in ${dayLabel}`
    : `You're on your 6-week free trial — ${dayLabel} remaining`;

  return (
    <div className={`flex items-center justify-between gap-4 border-b px-6 py-2.5 text-sm ${bannerCn}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Clock className={`h-4 w-4 shrink-0 ${iconCn}`} />
        <span className="font-medium truncate">{headline}</span>
        {(isUrgent || isWarning) && (
          <span className="hidden sm:inline text-xs opacity-70">
            · Waste logging, Bake Plan &amp; analytics disappear when it ends
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/pricing"
          className={`inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${ctaCn}`}
        >
          Upgrade to Pro — $9/mo
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-50 hover:opacity-80 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
