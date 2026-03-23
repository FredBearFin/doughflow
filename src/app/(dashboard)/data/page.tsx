"use client";

/**
 * Data page — /data
 *
 * Central hub for getting data in and out of DoughFlow.
 *   Export — CSV and PDF exports (tier-gated via ExportButtons)
 *   Import — Recipes, Ingredients, Sales history (all tiers)
 *
 * Import is always free: getting your data IN should never be paywalled.
 * Export is gated: CSV on Cottage+, PDF on Baker+.
 */

import { useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/ExportButtons";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ImportResult } from "@/lib/csv";

export default function DataPage() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting]       = useState(false);
  const [importError, setImportError]   = useState<string | null>(null);

  const recipeFileRef     = useRef<HTMLInputElement>(null);
  const ingredientFileRef = useRef<HTMLInputElement>(null);
  const salesFileRef      = useRef<HTMLInputElement>(null);

  async function handleImport(type: string, file: File) {
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/import/${type}`, { method: "POST", body: fd });
      if (!res.ok) {
        setImportError(`Upload failed (${res.status})`);
        return;
      }
      const { result } = await res.json();
      setImportResult(result);
    } catch {
      setImportError("Network error — please try again");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <TopBar title="Data" />

      <div className="p-6 space-y-6 max-w-2xl">

        {/* ── Export ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>
              Download your data as CSV or PDF. CSV available on Cottage plan and above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButtons />
          </CardContent>
        </Card>

        {/* ── Import ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
            <CardDescription>
              Bulk-load your data from a spreadsheet. Import is free on all plans —
              getting your data in should never cost you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Recipes */}
            <ImportSection
              title="Recipes"
              description={
                <>
                  <span className="font-medium">Required:</span> name<br />
                  <span className="font-medium">Optional:</span> batchSize (default 1), description, retailPrice
                </>
              }
              fileRef={recipeFileRef}
              templateHref="/api/export/recipes?template=1"
              importing={importing}
              onPick={(file) => handleImport("recipes", file)}
            />

            <div className="border-t border-stone-100" />

            {/* Ingredients */}
            <ImportSection
              title="Ingredients"
              description={
                <>
                  <span className="font-medium">Required:</span> name, unit
                  (LB / OZ / FL_OZ / CUP / TBSP / TSP / EACH / GRAM / KILOGRAM / MILLILITER / LITER)<br />
                  <span className="font-medium">Optional:</span> currentStock, reorderPoint, costPerUnit
                </>
              }
              fileRef={ingredientFileRef}
              templateHref="/api/export/ingredients?template=1"
              importing={importing}
              onPick={(file) => handleImport("ingredients", file)}
            />

            <div className="border-t border-stone-100" />

            {/* Sales history */}
            <ImportSection
              title="Sales History"
              description={
                <>
                  <span className="font-medium">Required:</span> date (YYYY-MM-DD), recipeName, qtySold<br />
                  <span className="font-medium">Optional:</span> qtyBaked (defaults to qtySold)<br />
                  <span className="text-stone-400">
                    Recipes are auto-created if they don&apos;t exist yet.
                  </span>
                </>
              }
              fileRef={salesFileRef}
              templateHref="/api/export/sales?template=1"
              importing={importing}
              onPick={(file) => handleImport("sales", file)}
            />

            {/* Result / error feedback */}
            {importError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {importError}
              </p>
            )}
            {importResult && <ImportResultSummary result={importResult} />}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── Shared import row ────────────────────────────────────────────────────────

function ImportSection({
  title,
  description,
  fileRef,
  templateHref,
  importing,
  onPick,
}: {
  title: string;
  description: React.ReactNode;
  fileRef: React.RefObject<HTMLInputElement | null>;
  templateHref: string;
  importing: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {importing ? "Importing…" : "Import CSV"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => (window.location.href = templateHref)}
        >
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>
      </div>
    </div>
  );
}

// ─── Import result summary ────────────────────────────────────────────────────

function ImportResultSummary({ result }: { result: ImportResult }) {
  const total = result.created + result.updated + result.skipped;
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        {total} row{total !== 1 ? "s" : ""} processed
      </div>
      <div className="flex gap-4 text-sm text-stone-600">
        <span><span className="font-medium text-green-700">{result.created}</span> created</span>
        <span><span className="font-medium text-blue-700">{result.updated}</span> updated</span>
        {result.skipped > 0 && (
          <span><span className="font-medium text-red-600">{result.skipped}</span> skipped</span>
        )}
      </div>
      {result.errors.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
