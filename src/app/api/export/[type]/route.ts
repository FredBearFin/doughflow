import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringifyCSV } from "@/lib/csv";

const TEMPLATES: Record<string, { columns: string[]; example: Record<string, string> }> = {
  ingredients: {
    columns: ["name", "unit", "currentStock", "reorderPoint", "costPerUnit"],
    example: { name: "Bread Flour", unit: "LB", currentStock: "50", reorderPoint: "10", costPerUnit: "0.85" },
  },
  recipes: {
    columns: ["name", "batchSize", "description", "retailPrice"],
    example: { name: "Sourdough Loaf", batchSize: "1", description: "Classic sourdough", retailPrice: "8.00" },
  },
  sales: {
    columns: ["date", "recipeName", "qtySold", "qtyBaked"],
    example: { date: "2026-03-20", recipeName: "Sourdough Loaf", qtySold: "10", qtyBaked: "12" },
  },
  waste: {
    columns: ["date", "recipeName", "qtyBaked", "qtySold", "qtyWasted"],
    example: { date: "2026-03-20", recipeName: "Sourdough Loaf", qtyBaked: "12", qtySold: "10", qtyWasted: "2" },
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
        costPerUnit: i.costPerUnit ?? "",
      }));
    } else if (type === "recipes") {
      const data = await prisma.recipe.findMany({
        where: { tenantId, active: true },
        orderBy: { name: "asc" },
      });
      rows = data.map((r) => ({
        name: r.name,
        batchSize: r.batchSize,
        description: r.description ?? "",
        retailPrice: r.retailPrice ?? "",
      }));
    } else if (type === "sales") {
      // Export bake/sell records — our WasteLog captures both baked + sold qty
      const data = await prisma.wasteLog.findMany({
        where: { tenantId },
        include: { recipe: true },
        orderBy: { date: "desc" },
      });
      rows = data.map((w) => ({
        date: w.date.toISOString().split("T")[0],
        recipeName: w.recipe.name,
        qtySold: w.qtySold,
        qtyBaked: w.qtyBaked,
      }));
    } else {
      // waste
      const data = await prisma.wasteLog.findMany({
        where: { tenantId },
        include: { recipe: true },
        orderBy: { date: "desc" },
      });
      rows = data.map((w) => ({
        date: w.date.toISOString().split("T")[0],
        recipeName: w.recipe.name,
        qtyBaked: w.qtyBaked,
        qtySold: w.qtySold,
        qtyWasted: w.qtyBaked - w.qtySold,
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
