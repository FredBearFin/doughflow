import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringifyCSV } from "@/lib/csv";

const TEMPLATES: Record<string, { columns: string[]; example: Record<string, string> }> = {
  ingredients: {
    columns: ["name", "unit", "currentStock", "reorderPoint", "costPerUnit", "sku"],
    example: { name: "Bread Flour", unit: "LB", currentStock: "50", reorderPoint: "10", costPerUnit: "0.85", sku: "" },
  },
  sales: {
    columns: ["date", "recipeName", "qty", "revenue"],
    example: { date: "2026-03-20", recipeName: "Sourdough Loaf", qty: "12", revenue: "96.00" },
  },
  waste: {
    columns: ["date", "ingredientName", "qty", "reason"],
    example: { date: "2026-03-20", ingredientName: "Bread Flour", qty: "2.5", reason: "Overproduction" },
  },
};

export async function GET(
  req: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;

  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: session.user.id },
  });
  if (!tenantUser) return new Response("Forbidden", { status: 403 });
  const { tenantId } = tenantUser;

  const tmpl = TEMPLATES[type];
  if (!tmpl) return new Response("Unknown export type", { status: 400 });

  const url = new URL(req.url);
  const isTemplate = url.searchParams.get("template") === "1";
  const today = new Date().toISOString().split("T")[0];

  let rows: Record<string, unknown>[];
  let filename: string;

  if (isTemplate) {
    rows = [tmpl.example];
    filename = `${type}-template.csv`;
  } else {
    filename = `${type}-${today}.csv`;

    if (type === "ingredients") {
      const data = await prisma.ingredient.findMany({
        where: { tenantId, active: true },
        orderBy: { name: "asc" },
      });
      rows = data.map((i) => ({
        name: i.name,
        unit: i.unit,
        currentStock: i.currentStock,
        reorderPoint: i.reorderPoint,
        costPerUnit: i.costPerUnit,
        sku: i.sku ?? "",
      }));
    } else if (type === "sales") {
      const data = await prisma.sale.findMany({
        where: { tenantId },
        include: { recipe: true },
        orderBy: { soldAt: "desc" },
      });
      rows = data.map((s) => ({
        date: s.soldAt.toISOString().split("T")[0],
        recipeName: s.recipe.name,
        qty: s.qty,
        revenue: s.revenue.toFixed(2),
      }));
    } else {
      // waste
      const data = await prisma.wasteLog.findMany({
        where: { tenantId },
        include: { ingredient: true },
        orderBy: { createdAt: "desc" },
      });
      rows = data.map((w) => ({
        date: w.createdAt.toISOString().split("T")[0],
        ingredientName: w.ingredient.name,
        qty: w.qty,
        reason: w.reason ?? "",
      }));
    }
  }

  return new Response(stringifyCSV(rows, tmpl.columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
