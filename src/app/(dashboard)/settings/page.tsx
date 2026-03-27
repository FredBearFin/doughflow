/**
 * Settings page — /settings
 *
 * Bakery name, account/subscription info, and import/export shortcut.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { CheckCircle2, Database, CreditCard, Sparkles } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Bakery name is required"),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const tenantId     = useTenantId();
  const utils        = trpc.useUtils();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "1";

  const [saved,          setSaved]          = useState(false);
  const [portalLoading,  setPortalLoading]  = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: tenant } = trpc.tenant.get.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId },
  );

  const { data: sub } = trpc.subscription.getMyTier.useQuery();

  const update = trpc.tenant.update.useMutation({
    onSuccess: () => {
      utils.tenant.get.invalidate({ tenantId: tenantId! });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values:   tenant ? { name: tenant.name } : undefined,
  });

  const onSubmit = (data: FormValues) => {
    if (!tenantId) return;
    update.mutate({ tenantId, name: data.name });
  };

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) router.push(data.url);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tier: "pro", billing: "monthly" }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) router.push(data.url);
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── Derived subscription display values ───────────────────────────────────
  const isPaid      = sub && sub.tier !== "FREE" && !sub.isTrialing;
  const isTrialing  = sub?.isTrialing;
  const isFreeExpired = sub && sub.tier === "FREE" && sub.status !== "TRIALING";
  const hasBilling  = isPaid; // has a Stripe customer — can open portal

  const planLabel = isTrialing
    ? `Pro trial — ${sub.trialDaysLeft} day${sub.trialDaysLeft === 1 ? "" : "s"} left`
    : isPaid
      ? "Pro"
      : "Free";

  const renewalLine = isPaid && sub.currentPeriodEnd
    ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : null;

  return (
    <div>
      <TopBar title="Settings" />

      <div className="p-6 space-y-6 max-w-2xl">

        {/* Upgrade success banner */}
        {justUpgraded && (
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            Welcome to Pro! All features are now unlocked.
          </div>
        )}

        {/* Bakery info — editable name */}
        <Card>
          <CardHeader>
            <CardTitle>Bakery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {saved && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Bakery name saved!
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Bakery Name</Label>
                <Input id="name" placeholder="Your bakery name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={update.isPending || !tenantId}>
                {update.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Billing / plan card */}
        <Card>
          <CardHeader>
            <CardTitle>Plan &amp; Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <dt className="text-stone-400">Current plan</dt>
              <dd className="font-medium text-stone-900">{planLabel}</dd>

              {renewalLine && (
                <>
                  <dt className="text-stone-400">Next renewal</dt>
                  <dd className="text-stone-700">{renewalLine}</dd>
                </>
              )}

              <dt className="text-stone-400">Bakery slug</dt>
              <dd className="font-mono text-stone-700">{tenant?.slug ?? "—"}</dd>
            </dl>

            <div className="pt-1 flex flex-col gap-2">
              {hasBilling ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {portalLoading ? "Opening…" : "Manage billing"}
                </Button>
              ) : isFreeExpired || (!isTrialing && !isPaid) ? (
                <Button
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {checkoutLoading ? "Redirecting…" : "Upgrade to Pro — $9/mo"}
                </Button>
              ) : null}
            </div>

            <p className="text-xs text-stone-400">
              {hasBilling
                ? "Cancel or change your plan any time from the billing portal."
                : isTrialing
                  ? "Your trial includes full Pro access. No credit card needed until you upgrade."
                  : "Upgrade any time to unlock Bake Plan, analytics, unlimited recipes, and more."}
            </p>
          </CardContent>
        </Card>

        {/* Data shortcut */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-700">Import &amp; Export</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Bulk-import recipes, ingredients, and sales history. Export your data as CSV or PDF.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/data">
              <Database className="h-3.5 w-3.5" />
              Go to Data
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
