"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import type { ImportResult } from "@/lib/csv";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const tenantId = useTenantId();

  const { data: tenant } = trpc.tenant.get.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId },
  );

  const utils = trpc.useUtils();
  const update = trpc.tenant.update.useMutation({
    onSuccess: () => utils.tenant.get.invalidate({ tenantId: tenantId! }),
  });

  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  useEffect(() => {
    if (tenant) reset({ name: tenant.name });
  }, [tenant, reset]);

  const onSubmit = (data: { name: string }) => {
    if (!tenantId) return;
    update.mutate({ tenantId, name: data.name });
  };

  // ─── CSV state ──────────────────────────────────────────────────────────────
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const ingredientFileRef = useRef<HTMLInputElement>(null);
  const salesFileRef = useRef<HTMLInputElement>(null);

  function handleExport(type: string) {
    window.location.href = `/api/export/${type}`;
  }

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
      <TopBar title="Settings" />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Bakery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Bakery Info</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Bakery Name</Label>
                <Input placeholder="Your bakery name" {...register("name", { required: true })} />
              </div>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account */}
        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-400">Slug</span>
                <span className="font-mono">{tenant.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Plan</span>
                <span>{tenant.plan}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Import / Export */}
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>Export your data or bulk import via CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Export */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Export</p>
              <div className="flex flex-wrap gap-2">
                {(["ingredients", "sales", "waste"] as const).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(type)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-100" />

            {/* Import — Ingredients */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Import Ingredients</p>
              <p className="text-xs text-stone-500">
                <span className="font-medium">Required:</span> name, unit (LB / OZ / FL_OZ / CUP / TBSP / TSP / EACH / GRAM / KILOGRAM / MILLILITER / LITER)
                <br />
                <span className="font-medium">Optional:</span> currentStock, reorderPoint, costPerUnit, sku
              </p>
              <div className="flex gap-2">
                <input
                  ref={ingredientFileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport("ingredients", file);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  onClick={() => ingredientFileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {importing ? "Importing…" : "Import CSV"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => (window.location.href = "/api/export/ingredients?template=1")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Template
                </Button>
              </div>
            </div>

            {/* Import — Sales */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Import Sales</p>
              <p className="text-xs text-stone-500">
                <span className="font-medium">Required:</span> date (YYYY-MM-DD), recipeName, qty, revenue
              </p>
              <div className="flex gap-2">
                <input
                  ref={salesFileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport("sales", file);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  onClick={() => salesFileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {importing ? "Importing…" : "Import CSV"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => (window.location.href = "/api/export/sales?template=1")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Template
                </Button>
              </div>
            </div>

            {/* Import result */}
            {importError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
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
            <p key={i} className="text-xs text-red-600">
              Row {e.row}: {e.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
