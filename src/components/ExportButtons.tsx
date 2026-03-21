"use client";

import Link from "next/link";
import { Download, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTier } from "@/hooks/useTier";

// ─── Single export button with lock state ────────────────────────────────────

function ExportBtn({
  label,
  icon: Icon,
  allowed,
  tooltip,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  allowed: boolean;
  tooltip: string;
  onClick?: () => void;
}) {
  if (allowed) {
    return (
      <Button variant="outline" size="sm" onClick={onClick}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  // Locked: entire button navigates to /pricing; tooltip explains why.
  return (
    <div className="relative group inline-block">
      <Button
        variant="outline"
        size="sm"
        className="text-stone-400 border-stone-200 hover:text-stone-400 hover:bg-transparent"
        asChild
      >
        <Link href="/pricing">
          <Lock className="h-3.5 w-3.5" />
          {label}
        </Link>
      </Button>

      {/* Hover tooltip */}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5
                   px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
      >
        {tooltip}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[5px] border-transparent border-t-stone-900" />
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

const CSV_TYPES: Array<{ type: string; label: string }> = [
  { type: "ingredients", label: "Ingredients" },
  { type: "sales",       label: "Sales"       },
  { type: "waste",       label: "Waste"        },
];

const PDF_TYPES: Array<{ type: string; label: string }> = [
  { type: "ingredients-pdf", label: "Ingredients" },
  { type: "sales-pdf",       label: "Sales Report" },
  { type: "waste-pdf",       label: "Waste Log"    },
];

export function ExportButtons() {
  const { hasCsvExport, hasPdfExport, isLoading } = useTier();

  // While resolving, render placeholders to avoid layout shift.
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-wrap gap-2">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-8 w-28 animate-pulse rounded-md bg-stone-100" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CSV */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">CSV</p>
        <div className="flex flex-wrap gap-2">
          {CSV_TYPES.map(({ type, label }) => (
            <ExportBtn
              key={type}
              label={label}
              icon={Download}
              allowed={hasCsvExport}
              tooltip="CSV export — upgrade to Cottage ($6/mo)"
              onClick={() => (window.location.href = `/api/export/${type}`)}
            />
          ))}
        </div>
      </div>

      {/* PDF */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
          PDF
          {!hasPdfExport && (
            <span className="ml-2 normal-case font-normal text-stone-400">
              · Baker plan and above
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {PDF_TYPES.map(({ type, label }) => (
            <ExportBtn
              key={type}
              label={label}
              icon={FileText}
              allowed={hasPdfExport}
              tooltip="PDF reports — upgrade to Baker ($14/mo)"
              onClick={() => (window.location.href = `/api/export/${type}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
