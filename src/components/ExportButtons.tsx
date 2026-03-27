"use client";

import Link from "next/link";
import { Download, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTier } from "@/hooks/useTier";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportBtnProps {
  label: string;
  icon: React.ElementType;
  allowed: boolean;
  tooltip: string;
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// ExportBtn — single export button, locked or active
// ---------------------------------------------------------------------------

function ExportBtn({ label, icon: Icon, allowed, tooltip, onClick }: ExportBtnProps) {
  if (allowed) {
    return (
      <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <div className="relative group">
      <Link href="/pricing">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 opacity-50 cursor-pointer"
          tabIndex={-1}
        >
          <Lock className="h-4 w-4" />
          {label}
        </Button>
      </Link>
      {/* Tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block whitespace-nowrap rounded bg-stone-800 px-2 py-1 text-xs text-white z-10">
        {tooltip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export type configs
// ---------------------------------------------------------------------------

const CSV_TYPES = [
  { label: "Ingredients", type: "ingredients" },
  { label: "Sales", type: "sales" },
  { label: "Waste", type: "waste" },
] as const;

const PDF_TYPES = [
  { label: "Ingredients", type: "ingredients-pdf" },
  { label: "Sales Report", type: "sales-pdf" },
  { label: "Waste Log", type: "waste-pdf" },
] as const;

// ---------------------------------------------------------------------------
// ExportButtons — main component
// ---------------------------------------------------------------------------

export function ExportButtons() {
  const { hasCsvExport, hasPdfExport, isLoading } = useTier();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-100 rounded w-48" />
        <div className="h-8 bg-stone-100 rounded w-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSV exports */}
      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">CSV</p>
        <div className="flex flex-wrap gap-2">
          {CSV_TYPES.map(({ label, type }) => (
            <ExportBtn
              key={type}
              label={label}
              icon={Download}
              allowed={hasCsvExport}
              tooltip="CSV export — upgrade to Pro ($9/mo)"
              onClick={() => {
                window.location.href = `/api/export/${type}`;
              }}
            />
          ))}
        </div>
      </div>

      {/* PDF exports */}
      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">PDF</p>
        <div className="flex flex-wrap gap-2">
          {PDF_TYPES.map(({ label, type }) => (
            <ExportBtn
              key={type}
              label={label}
              icon={FileText}
              allowed={hasPdfExport}
              tooltip="PDF reports — upgrade to Pro ($9/mo)"
              onClick={() => {
                window.location.href = `/api/export/${type}`;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
