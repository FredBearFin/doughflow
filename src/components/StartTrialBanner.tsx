"use client";

/**
 * StartTrialBanner — shown to users who have no subscription row yet
 * (i.e., they pre-date the subscription system).
 *
 * Unlike TrialBanner (which is shown during an active trial), this is
 * an explicit opt-in prompt.  The user consciously clicks "Start my
 * free trial" — the trial clock only starts at that moment.
 */

import { useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTier } from "@/hooks/useTier";

export function StartTrialBanner() {
  const { canStartTrial, isLoading } = useTier();
  const [dismissed, setDismissed]   = useState(false);

  const utils = trpc.useUtils();

  const startTrial = trpc.subscription.startTrial.useMutation({
    onSuccess: () => {
      // Invalidate the tier cache so the dashboard reflects the new trial
      void utils.subscription.getMyTier.invalidate();
    },
  });

  if (isLoading || !canStartTrial || dismissed) return null;

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm border-b"
      style={{
        background:   "linear-gradient(90deg, #FFFBEB 0%, #FEF9EC 100%)",
        borderColor:  "#FDE68A",
      }}
    >
      {/* Left: icon + copy */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="font-semibold truncate text-amber-800">
          You&apos;re eligible for a 6-week free trial
        </span>
        <span className="hidden sm:inline text-xs font-medium text-amber-600 shrink-0">
          · Unlock all Pro features — no card required
        </span>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => startTrial.mutate()}
          disabled={startTrial.isPending}
          className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3.5 text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
        >
          {startTrial.isPending ? "Starting…" : "Start my free trial"}
          {!startTrial.isPending && <ArrowRight className="h-3 w-3" />}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-100 hover:text-amber-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
