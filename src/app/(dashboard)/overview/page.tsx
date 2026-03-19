"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTenantId } from "@/lib/useTenant";
import { formatCurrency } from "@/lib/utils";
import { Package, AlertTriangle, ShoppingCart, TrendingUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const tenantId = useTenantId();

  const { data: overview, isLoading } = trpc.analytics.overview.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: ingredients } = trpc.ingredient.getAll.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const lowStockItems = ingredients?.filter(
    (i) => i.currentStock <= i.reorderPoint && i.reorderPoint > 0
  ) ?? [];

  return (
    <div>
      <TopBar title="Overview" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Ingredients"
            value={overview?.ingredientCount ?? "—"}
            icon={<Package className="h-5 w-5 text-amber-500" />}
            isLoading={isLoading}
          />
          <StatCard
            label="Low Stock Items"
            value={overview?.lowStockCount ?? "—"}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            highlight={(overview?.lowStockCount ?? 0) > 0}
            isLoading={isLoading}
          />
          <StatCard
            label="Pending Orders"
            value={overview?.pendingOrders ?? "—"}
            icon={<ShoppingCart className="h-5 w-5 text-amber-500" />}
            isLoading={isLoading}
          />
          <StatCard
            label="Revenue (30d)"
            value={overview ? formatCurrency(overview.recentRevenue) : "—"}
            icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low stock alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">
                  All ingredients well stocked
                </p>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 6).map((ing) => (
                    <Link
                      key={ing.id}
                      href={`/pantry/${ing.id}`}
                      className="flex items-center justify-between rounded-lg p-3 hover:bg-stone-50 transition-colors"
                    >
                      <span className="font-medium text-stone-900">{ing.name}</span>
                      <span className="tabular-nums text-sm text-red-600 font-medium">
                        {ing.currentStock.toFixed(0)} {ing.unit.toLowerCase()}
                      </span>
                    </Link>
                  ))}
                  {lowStockItems.length > 6 && (
                    <Link href="/pantry">
                      <Button variant="ghost" size="sm" className="w-full mt-1">
                        View all {lowStockItems.length} items
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waste this week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                Waste Cost This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="tabular-nums text-4xl font-bold text-stone-900">
                    {formatCurrency(overview.recentWasteCost)}
                  </p>
                  <p className="text-sm text-stone-400 mt-1">last 30 days</p>
                  <Link href="/waste" className="mt-4">
                    <Button variant="outline" size="sm">
                      Log Waste
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="h-32 animate-pulse bg-stone-100 rounded-lg" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/pantry">
            <Button variant="outline">
              <Package className="h-4 w-4" />
              Manage Pantry
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline">
              <ShoppingCart className="h-4 w-4" />
              View Orders
            </Button>
          </Link>
          <Link href="/waste">
            <Button variant="outline">
              <Trash2 className="h-4 w-4" />
              Log Waste
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-200 bg-amber-50" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500">{label}</span>
          {icon}
        </div>
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-stone-200" />
        ) : (
          <p className="tabular-nums text-2xl font-bold text-stone-900">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
