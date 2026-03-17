"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ShoppingCart } from "lucide-react";
import { OrderFormDialog } from "@/components/orders/OrderFormDialog";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  CONFIRMED: "Confirmed",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

type POStatus = "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";

function statusVariant(status: string) {
  const map: Record<string, string> = {
    DRAFT: "draft",
    SENT: "sent",
    CONFIRMED: "confirmed",
    RECEIVED: "received",
    CANCELLED: "cancelled",
  };
  return (map[status] ?? "default") as any;
}

export default function OrdersPage() {
  const tenantId = useTenantId();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<POStatus | "ALL">("ALL");

  const { data: orders, isLoading } = trpc.order.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const filtered = orders?.filter(
    (o) => statusFilter === "ALL" || o.status === statusFilter
  );

  const pendingCount = orders?.filter((o) => ["DRAFT", "SENT", "CONFIRMED"].includes(o.status)).length ?? 0;

  return (
    <div>
      <TopBar title="Purchase Orders">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </TopBar>

      <div className="p-6 space-y-5">
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <ShoppingCart className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {pendingCount} order{pendingCount !== 1 ? "s" : ""} pending action
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-amber-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {s === "ALL" ? "All" : STATUS_LABEL[s]}
              </button>
            )
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingCart className="h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered?.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-stone-900">{order.supplier.name}</p>
                          <Badge variant={statusVariant(order.status)}>
                            {STATUS_LABEL[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-400">
                          {order.lines.length} item{order.lines.length !== 1 ? "s" : ""} ·{" "}
                          {formatDate(order.createdAt)}
                          {order.expectedAt && ` · Expected ${formatDate(order.expectedAt)}`}
                        </p>
                      </div>
                      <p className="tabular-nums font-semibold text-stone-900 text-lg">
                        {formatCurrency(order.totalCost)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {tenantId && (
        <OrderFormDialog
          tenantId={tenantId}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}
