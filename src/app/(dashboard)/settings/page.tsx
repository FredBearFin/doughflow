"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";

export default function SettingsPage() {
  const tenantId = useTenantId();

  const { data: tenant } = trpc.tenant.get.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
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

  return (
    <div>
      <TopBar title="Settings" />

      <div className="p-6 space-y-6 max-w-2xl">
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
      </div>
    </div>
  );
}
