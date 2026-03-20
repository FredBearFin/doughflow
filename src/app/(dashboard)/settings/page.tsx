/**
 * Settings page — /settings
 *
 * Allows the bakery owner to update their bakery's display name and view
 * read-only account details (slug, plan).
 *
 * The Bakery Name form is wired to `trpc.tenant.update` — changes save
 * immediately to the database when "Save Changes" is clicked.
 *
 * This is a Client Component because it uses react-hook-form and tRPC mutations.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { CheckCircle2 } from "lucide-react";

/** Validation schema for the bakery info form */
const schema = z.object({
  name: z.string().min(1, "Bakery name is required"),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const tenantId = useTenantId();
  const utils    = trpc.useUtils();

  /** Shows the "Saved!" confirmation banner briefly after a successful save */
  const [saved, setSaved] = useState(false);

  // Fetch current tenant info to pre-fill the form
  const { data: tenant } = trpc.tenant.get.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Mutation to persist the bakery name change
  const update = trpc.tenant.update.useMutation({
    onSuccess: () => {
      // Invalidate so any cached tenant name (e.g. in sidebar) refreshes
      utils.tenant.get.invalidate({ tenantId: tenantId! });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // `values` (not `defaultValues`) re-syncs the form when tenant data loads
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values:   tenant ? { name: tenant.name } : undefined,
  });

  const onSubmit = (data: FormValues) => {
    if (!tenantId) return;
    update.mutate({ tenantId, name: data.name });
  };

  return (
    <div>
      <TopBar title="Settings" />

      {/* max-w-2xl constrains the form width for comfortable reading on large screens */}
      <div className="p-6 space-y-6 max-w-2xl">

        {/* Bakery info — editable name */}
        <Card>
          <CardHeader>
            <CardTitle>Bakery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved confirmation banner — auto-dismisses after 3 seconds */}
            {saved && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Bakery name saved!
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Bakery Name</Label>
                <Input
                  id="name"
                  placeholder="Your bakery name"
                  {...register("name")}
                />
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

        {/* Account info — read-only plan and slug for support reference */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <dt className="text-stone-400">Plan</dt>
              <dd className="font-medium text-stone-900 capitalize">
                {tenant?.plan?.toLowerCase() ?? "—"}
              </dd>
              <dt className="text-stone-400">Bakery slug</dt>
              <dd className="font-mono text-stone-700">
                {tenant?.slug ?? "—"}
              </dd>
            </dl>
            <p className="text-xs text-stone-400 mt-4">
              The slug is your URL-safe identifier — contact support to change it.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
