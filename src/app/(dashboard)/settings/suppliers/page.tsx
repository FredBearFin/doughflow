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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { Plus, Building2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SuppliersPage() {
  const tenantId = useTenantId();
  const [showCreate, setShowCreate] = useState(false);

  const utils = trpc.useUtils();
  const { data: suppliers, isLoading } = trpc.analytics.supplier.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const create = trpc.analytics.createSupplier.useMutation({
    onSuccess: () => {
      utils.analytics.supplier.invalidate({ tenantId: tenantId! });
      setShowCreate(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    create.mutate({
      tenantId: tenantId!,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
      website: data.website,
      notes: data.notes,
    });
  };

  return (
    <div>
      <TopBar title="Suppliers">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </TopBar>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : suppliers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 className="h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-400 mb-4">No suppliers yet</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add your first supplier
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers?.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900">{s.name}</h3>
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="text-sm text-amber-600 hover:underline">
                          {s.email}
                        </a>
                      )}
                      {s.phone && <p className="text-sm text-stone-500">{s.phone}</p>}
                    </div>
                    <div className="text-right text-xs text-stone-400">
                      <p>{s._count.ingredients} ingredients</p>
                      <p>{s._count.orders} orders</p>
                    </div>
                  </div>
                  {s.notes && <p className="text-xs text-stone-400 mt-2">{s.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="City Mill Supply" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="orders@supplier.com" {...register("email")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register("website")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Adding…" : "Add Supplier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
