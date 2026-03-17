import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkReorderNeeds } from "@/lib/reorder";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({ where: { plan: "ACTIVE" } });

  const results: { tenantId: string; poId: string; alertCount: number }[] = [];
  for (const tenant of tenants) {
    const alerts = await checkReorderNeeds(tenant.id);
    if (alerts.length > 0) {
      // Group by supplier
      const bySupplier = new Map<string, typeof alerts>();
      for (const alert of alerts) {
        if (!alert.ingredient.supplierId) continue;
        const key = alert.ingredient.supplierId;
        const existing = bySupplier.get(key) ?? [];
        existing.push(alert);
        bySupplier.set(key, existing);
      }

      for (const [supplierId, lines] of bySupplier) {
        const totalCost = lines.reduce(
          (sum, l) => sum + l.reorderQty * l.ingredient.costPerUnit,
          0
        );
        const po = await prisma.purchaseOrder.create({
          data: {
            tenantId: tenant.id,
            supplierId,
            totalCost,
            lines: {
              create: lines.map((l) => ({
                ingredientId: l.ingredient.id,
                qty: l.reorderQty,
                unitCost: l.ingredient.costPerUnit,
              })),
            },
          },
        });
        results.push({ tenantId: tenant.id, poId: po.id, alertCount: lines.length });
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
