import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, type ImportResult } from "@/lib/csv";

const VALID_UNITS = [
  "LB", "OZ", "FL_OZ", "CUP", "TBSP", "TSP", "EACH",
  "GRAM", "KILOGRAM", "MILLILITER", "LITER",
] as const;

export async function POST(
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

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const rows = parseCSV(await file.text());
  if (rows.length === 0) {
    return Response.json({ result: { created: 0, updated: 0, skipped: 0, errors: [] } });
  }

  if (type === "ingredients") {
    const result = await importIngredients(tenantId, rows);
    return Response.json({ result });
  }

  if (type === "recipes") {
    const result = await importRecipes(tenantId, rows);
    return Response.json({ result });
  }

  if (type === "sales") {
    const result = await importSales(tenantId, rows);
    return Response.json({ result });
  }

  return Response.json({ error: "Unknown import type" }, { status: 400 });
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

async function importIngredients(
  tenantId: string,
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Pre-fetch existing names (one query) to distinguish create vs update
  const existing = new Set(
    (await prisma.ingredient.findMany({ where: { tenantId }, select: { name: true } })).map(
      (i) => i.name,
    ),
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-indexed + header row
    const row = rows[i];

    const name = row.name?.trim();
    if (!name) {
      result.errors.push({ row: rowNum, message: "missing name" });
      result.skipped++;
      continue;
    }

    const unit = row.unit?.trim().toUpperCase();
    if (!VALID_UNITS.includes(unit as (typeof VALID_UNITS)[number])) {
      result.errors.push({
        row: rowNum,
        message: `invalid unit "${row.unit}" — must be one of: ${VALID_UNITS.join(", ")}`,
      });
      result.skipped++;
      continue;
    }

    const currentStock = row.currentStock ? parseFloat(row.currentStock) : 0;
    const reorderPoint = row.reorderPoint ? parseFloat(row.reorderPoint) : 0;
    const costPerUnitRaw = row.costPerUnit?.trim();
    const costPerUnit =
      costPerUnitRaw && !isNaN(parseFloat(costPerUnitRaw))
        ? parseFloat(costPerUnitRaw)
        : undefined;

    try {
      await prisma.ingredient.upsert({
        where: { tenantId_name: { tenantId, name } },
        create: {
          tenantId,
          name,
          unit,
          currentStock: isNaN(currentStock) ? 0 : currentStock,
          reorderPoint: isNaN(reorderPoint) ? 0 : reorderPoint,
          ...(costPerUnit !== undefined && { costPerUnit }),
        },
        update: {
          unit,
          currentStock: isNaN(currentStock) ? 0 : currentStock,
          reorderPoint: isNaN(reorderPoint) ? 0 : reorderPoint,
          ...(costPerUnit !== undefined && { costPerUnit }),
        },
      });

      if (existing.has(name)) {
        result.updated++;
      } else {
        result.created++;
        existing.add(name); // guard against duplicate rows in same file
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: err instanceof Error ? err.message : "DB error" });
      result.skipped++;
    }
  }

  return result;
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

async function importRecipes(
  tenantId: string,
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const existing = new Set(
    (await prisma.recipe.findMany({ where: { tenantId }, select: { name: true } })).map(
      (r) => r.name,
    ),
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i];

    const name = row.name?.trim();
    if (!name) {
      result.errors.push({ row: rowNum, message: "missing name" });
      result.skipped++;
      continue;
    }

    const batchSize = row.batchSize ? parseInt(row.batchSize) : 1;
    if (isNaN(batchSize) || batchSize < 1) {
      result.errors.push({ row: rowNum, message: `invalid batchSize "${row.batchSize}" — must be integer ≥ 1` });
      result.skipped++;
      continue;
    }

    const description = row.description?.trim() || null;
    const retailPriceRaw = row.retailPrice?.trim();
    const retailPrice =
      retailPriceRaw && !isNaN(parseFloat(retailPriceRaw))
        ? parseFloat(retailPriceRaw)
        : undefined;

    try {
      await prisma.recipe.upsert({
        where: { tenantId_name: { tenantId, name } },
        create: {
          tenantId,
          name,
          batchSize,
          ...(description && { description }),
          ...(retailPrice !== undefined && { retailPrice }),
        },
        update: {
          batchSize,
          ...(description !== null && { description }),
          ...(retailPrice !== undefined && { retailPrice }),
        },
      });

      if (existing.has(name)) {
        result.updated++;
      } else {
        result.created++;
        existing.add(name);
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: err instanceof Error ? err.message : "DB error" });
      result.skipped++;
    }
  }

  return result;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

async function importSales(
  tenantId: string,
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Cache recipe lookups / auto-creates to avoid repeated DB hits for same name
  const recipeCache = new Map<string, string>(); // name → id

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i];

    const soldAt = new Date(row.date?.trim());
    if (isNaN(soldAt.getTime())) {
      result.errors.push({ row: rowNum, message: `invalid date "${row.date}" — use YYYY-MM-DD` });
      result.skipped++;
      continue;
    }

    const recipeName = row.recipeName?.trim();
    if (!recipeName) {
      result.errors.push({ row: rowNum, message: "missing recipeName" });
      result.skipped++;
      continue;
    }

    const qtySold = parseInt(row.qty ?? row.qtySold);
    if (isNaN(qtySold) || qtySold < 0) {
      result.errors.push({ row: rowNum, message: `invalid qty "${row.qty ?? row.qtySold}" — must be integer ≥ 0` });
      result.skipped++;
      continue;
    }
    const qtyBaked = row.qtyBaked ? parseInt(row.qtyBaked) : qtySold;

    // Recipe lookup — auto-create if not found so historical data can be imported
    // before recipes are fully configured in the app.
    let recipeId = recipeCache.get(recipeName);
    if (!recipeId) {
      const recipe = await prisma.recipe.upsert({
        where: { tenantId_name: { tenantId, name: recipeName } },
        create: { tenantId, name: recipeName, batchSize: 1 },
        update: {}, // don't overwrite existing recipe settings
        select: { id: true },
      });
      recipeId = recipe.id;
      recipeCache.set(recipeName, recipeId);
    }

    try {
      await prisma.wasteLog.create({
        data: { tenantId, recipeId, date: soldAt, qtyBaked, qtySold },
      });
      result.created++;
    } catch (err) {
      result.errors.push({ row: rowNum, message: err instanceof Error ? err.message : "DB error" });
      result.skipped++;
    }
  }

  return result;
}
