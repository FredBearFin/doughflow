"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatUnit } from "@/types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  CONFIRMED: "Confirmed",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = useTenantId();
  const utils = trpc.useUtils();
  const [receiving, setReceiving] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const { data: order, isLoading } = trpc.order.getById.useQuery(
    { id, tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => utils.order.getById.invalidate({ id, tenantId: tenantId! }),
  });

  const receiveOrder = trpc.order.receive.useMutation({
    onSuccess: () => {
      utils.order.getById.invalidate({ id, tenantId: tenantId! });
      utils.ingredient.getAll.invalidate({ tenantId: tenantId! });
      setReceiving(false);
    },
  });

  if (isLoading || !order) {
    return (
      <div>
        <TopBar title="Loading…" />
        <div className="p-6">
          <div className="h-48 animate-pulse rounded-xl bg-stone-200" />
        </div>
      </div>
    );
  }

  const handleReceive = () => {
    receiveOrder.mutate({
      id,
      tenantId: tenantId!,
      lines: order.lines.map((line) => ({
        lineId: line.id,
        ingredientId: line.ingredientId,
        receivedQty: receivedQtys[line.id] ?? line.qty,
        unitCost: line.unitCost,
      })),
    });
  };

  return (
    <div>
      <TopBar title={`PO — ${order.supplier.name}`}>
        {order.status === "DRAFT" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus.mutate({ id, tenantId: tenantId!, status: "SENT" })}
            disabled={updateStatus.isPending}
          >
            Mark as Sent
          </Button>
        )}
        {order.status === "SENT" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus.mutate({ id, tenantId: tenantId!, status: "CONFIRMED" })}
          >
            Mark Confirmed
          </Button>
        )}
        {(order.status === "CONFIRMED" || order.status === "SENT") && (
          <Button size="sm" onClick={() => setReceiving(true)}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Receive Order
          </Button>
        )}
      </TopBar>

      <div className="p-6 space-y-6">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Orders
        </Link>

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-stone-900">{order.supplier.name}</h2>
          <Badge variant={order.status.toLowerCase() as any}>{STATUS_LABEL[order.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Created", formatDate(order.createdAt)],
            ["Expected", order.expectedAt ? formatDate(order.expectedAt) : "—"],
            ["Total", formatCurrency(order.totalCost)],
            ["Items", String(order.lines.length)],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-400 mb-1">{label}</p>
                <p className="font-semibold text-stone-900">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y divide-stone-100">
              {order.lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-stone-900">{line.ingredient.name}</p>
                    <p className="text-xs text-stone-400">
                      {formatUnit(line.qty, line.ingredient.unit)} @ {formatCurrency(line.unitCost)} / {line.ingredient.unit.toLowerCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums font-semibold">
                      {formatCurrency(line.qty * line.unitCost)}
                    </p>
                    {line.receivedQty !== null && line.receivedQty !== undefined && (
                      <p className="text-xs text-green-600">
                        Received: {formatUnit(line.receivedQty, line.ingredient.unit)}
                      </p>
                    )}
                    {receiving && (
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={line.qty}
                        className="w-28 mt-1 text-sm"
                        onChange={(e) =>
                          setReceivedQtys((prev) => ({
                            ...prev,
                            [line.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {receiving && (
              <div className="flex gap-2 mt-4 justify-end">
                <Button variant="outline" onClick={() => setReceiving(false)}>Cancel</Button>
                <Button onClick={handleReceive} disabled={receiveOrder.isPending}>
                  <CheckCircle2 className="h-4 w-4" />
                  {receiveOrder.isPending ? "Processing…" : "Confirm Receipt"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {order.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-stone-500">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
