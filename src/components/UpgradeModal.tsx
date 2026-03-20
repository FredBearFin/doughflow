"use client";

import Link from "next/link";
import { ChefHat, Sparkles, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short headline, e.g. "Recipe limit reached" */
  title?: string;
  /** One-liner explaining the wall hit */
  limitLine?: string;
  /** What they unlock on the next tier */
  unlockLine?: string;
  /** CTA button text */
  ctaLabel?: string;
  /** Where the CTA links — defaults to /pricing */
  ctaHref?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title = "You've hit the free limit",
  limitLine = "Free accounts can track up to 3 recipes.",
  unlockLine = "Upgrade to Cottage for up to 10 recipes, Bake Plan forecasts, full cost tracking, and more.",
  ctaLabel = "Upgrade to Cottage — $6/mo",
  ctaHref = "/pricing",
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        {/* Icon badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
          <Lock className="h-6 w-6 text-amber-500" />
        </div>

        <DialogHeader className="items-center">
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-stone-500">
            {limitLine}
          </DialogDescription>
        </DialogHeader>

        {/* What they unlock */}
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900 flex gap-2 text-left">
          <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <span>{unlockLine}</span>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <Button
            asChild
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          >
            <Link href={ctaHref} onClick={() => onOpenChange(false)}>
              <ChefHat className="h-4 w-4 mr-1.5" />
              {ctaLabel}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full text-stone-400 hover:text-stone-600"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
