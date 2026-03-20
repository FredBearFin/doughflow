/**
 * Prisma seed script — populates a demo bakery for local development and testing.
 *
 * Run with: npx prisma db seed
 * (configured in package.json → "prisma": { "seed": "ts-node prisma/seed.ts" })
 *
 * Seeds:
 *   - 1 tenant (Flour & Salt Bakery)
 *   - 1 demo user
 *   - 12 ingredients with realistic stock levels and low-stock thresholds
 *   - 8 bakery products (recipes) with full BOM ingredient lists
 *   - 30 days of historical waste logs (qtyBaked / qtySold per product per day)
 *     so the demand forecast panel has enough data to generate suggestions
 *
 * All existing data is wiped before seeding so this script is idempotent —
 * safe to re-run at any time.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo bakery...");

  // ─── Wipe existing data (order matters for FK constraints) ────────────────
  await prisma.$transaction([
    prisma.wasteLog.deleteMany(),
    prisma.recipeIngredient.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.ingredient.deleteMany(),
    prisma.tenantUser.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ─── Tenant ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name: "Flour & Salt Bakery",
      slug: "flour-and-salt",
      plan: "ACTIVE",
    },
  });

  // ─── Demo User ────────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: "owner@flourandsalt.com",
      name: "Sam Baker",
      emailVerified: new Date(),
    },
  });

  await prisma.tenantUser.create({
    data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
  });

  // ─── Ingredients (12) ────────────────────────────────────────────────────
  // reorderPoint = low-stock alert threshold (shown in pantry as "Alert at X")
  const ingredientData = [
    { name: "Bread Flour",    unit: "GRAM",       stock: 25000, reorderPt: 5000 },
    { name: "AP Flour",       unit: "GRAM",       stock: 18000, reorderPt: 4000 },
    { name: "Rye Flour",      unit: "GRAM",       stock: 8000,  reorderPt: 2000 },
    { name: "Oats",           unit: "GRAM",       stock: 5000,  reorderPt: 1000 },
    { name: "Sugar",          unit: "GRAM",       stock: 12000, reorderPt: 2000 },
    { name: "Salt",           unit: "GRAM",       stock: 3000,  reorderPt: 500  },
    { name: "Instant Yeast",  unit: "GRAM",       stock: 500,   reorderPt: 100  },
    { name: "Olive Oil",      unit: "MILLILITER", stock: 3000,  reorderPt: 500  },
    { name: "Butter",         unit: "GRAM",       stock: 4000,  reorderPt: 800  },
    { name: "Eggs",           unit: "EACH",       stock: 120,   reorderPt: 24   },
    { name: "Whole Milk",     unit: "MILLILITER", stock: 5000,  reorderPt: 1000 },
    { name: "Cream Cheese",   unit: "GRAM",       stock: 2000,  reorderPt: 400  },
  ] as const;

  // Map ingredient name → created Prisma record (for BOM line references below)
  const ingredients: Record<string, { id: string }> = {};
  for (const ing of ingredientData) {
    const created = await prisma.ingredient.create({
      data: {
        tenantId:     tenant.id,
        name:         ing.name,
        unit:         ing.unit as string,
        currentStock: ing.stock,
        reorderPoint: ing.reorderPt,
      },
    });
    ingredients[ing.name] = created;
  }

  // ─── Products / Recipes (8) ───────────────────────────────────────────────
  // batchSize = how many units (loaves / rolls / pieces) one batch produces.
  // The BOM ingredient quantities are measured per batch.
  const recipeData = [
    {
      name: "Sourdough Loaf",
      desc: "Classic long-ferment sourdough",
      batch: 2,
      lines: [
        { name: "Bread Flour", qty: 1000 },
        { name: "Salt",        qty: 20   },
        { name: "Instant Yeast", qty: 2  },
      ],
    },
    {
      name: "Croissant",
      desc: "Laminated butter croissant",
      batch: 12,
      lines: [
        { name: "AP Flour",     qty: 500 },
        { name: "Butter",       qty: 300 },
        { name: "Sugar",        qty: 50  },
        { name: "Salt",         qty: 10  },
        { name: "Instant Yeast", qty: 8  },
        { name: "Whole Milk",   qty: 200 },
      ],
    },
    {
      name: "Bagel",
      desc: "NY-style boiled bagel",
      batch: 12,
      lines: [
        { name: "Bread Flour", qty: 600 },
        { name: "Salt",        qty: 12  },
        { name: "Instant Yeast", qty: 6 },
        { name: "Sugar",       qty: 20  },
      ],
    },
    {
      name: "Cinnamon Roll",
      desc: "Soft enriched cinnamon roll with cream cheese frosting",
      batch: 9,
      lines: [
        { name: "AP Flour",     qty: 400 },
        { name: "Butter",       qty: 100 },
        { name: "Sugar",        qty: 80  },
        { name: "Salt",         qty: 5   },
        { name: "Instant Yeast", qty: 7  },
        { name: "Whole Milk",   qty: 180 },
        { name: "Cream Cheese", qty: 120 },
        { name: "Eggs",         qty: 2   },
      ],
    },
    {
      name: "Focaccia",
      desc: "Roman-style olive oil focaccia",
      batch: 4,
      lines: [
        { name: "Bread Flour", qty: 500 },
        { name: "Salt",        qty: 10  },
        { name: "Instant Yeast", qty: 4 },
        { name: "Olive Oil",   qty: 80  },
      ],
    },
    {
      name: "Baguette",
      desc: "Traditional French baguette",
      batch: 6,
      lines: [
        { name: "Bread Flour", qty: 600 },
        { name: "Salt",        qty: 12  },
        { name: "Instant Yeast", qty: 5 },
      ],
    },
    {
      name: "Chocolate Chip Cookie",
      desc: "Brown butter chocolate chip cookies",
      batch: 24,
      lines: [
        { name: "AP Flour", qty: 280 },
        { name: "Butter",   qty: 220 },
        { name: "Sugar",    qty: 200 },
        { name: "Salt",     qty: 5   },
        { name: "Eggs",     qty: 2   },
      ],
    },
    {
      name: "Cream Cheese Danish",
      desc: "Flaky danish with cream cheese filling",
      batch: 8,
      lines: [
        { name: "AP Flour",     qty: 350 },
        { name: "Butter",       qty: 200 },
        { name: "Sugar",        qty: 60  },
        { name: "Salt",         qty: 5   },
        { name: "Instant Yeast", qty: 6  },
        { name: "Whole Milk",   qty: 120 },
        { name: "Cream Cheese", qty: 200 },
        { name: "Eggs",         qty: 1   },
      ],
    },
  ];

  // Map product name → created Prisma record (for waste log references below)
  const recipes: Record<string, { id: string; batchSize: number }> = {};
  for (const r of recipeData) {
    const created = await prisma.recipe.create({
      data: {
        tenantId:    tenant.id,
        name:        r.name,
        description: r.desc,
        batchSize:   r.batch,
        ingredients: {
          create: r.lines.map((l) => ({
            ingredientId: ingredients[l.name].id,
            quantity:     l.qty,
          })),
        },
      },
    });
    recipes[r.name] = { id: created.id, batchSize: r.batch };
  }

  // ─── 30 days of waste logs ────────────────────────────────────────────────
  // Each entry records how many units were baked and sold on a given day.
  // qtyWasted is derived (qtyBaked - qtySold) — not stored in the DB.
  // Weekends sell roughly 60% more than weekdays.
  //
  // This historical data powers the demand forecast:
  //   suggestedQty = avg(qtySold on same day-of-week over last N weeks) × 1.1
  const wasteData = [
    { recipe: "Sourdough Loaf",         weekdayBaked: 6,  weekdayScold: 5,  weekendBaked: 14, weekendSold: 12 },
    { recipe: "Croissant",              weekdayBaked: 22, weekdayScold: 18, weekendBaked: 36, weekendSold: 30 },
    { recipe: "Bagel",                  weekdayBaked: 28, weekdayScold: 24, weekendBaked: 40, weekendSold: 36 },
    { recipe: "Cinnamon Roll",          weekdayBaked: 14, weekdayScold: 12, weekendBaked: 26, weekendSold: 22 },
    { recipe: "Focaccia",               weekdayBaked: 8,  weekdayScold: 6,  weekendBaked: 12, weekendSold: 10 },
    { recipe: "Baguette",               weekdayBaked: 16, weekdayScold: 14, weekendBaked: 24, weekendSold: 20 },
    { recipe: "Chocolate Chip Cookie",  weekdayBaked: 36, weekdayScold: 30, weekendBaked: 54, weekendSold: 48 },
    { recipe: "Cream Cheese Danish",    weekdayBaked: 10, weekdayScold: 8,  weekendBaked: 18, weekendSold: 16 },
  ];

  const today = new Date();
  // Seed 30 days of history so demand forecast has plenty of same-day-of-week data
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    // Strip time component — WasteLog.date is a DATE column
    date.setHours(0, 0, 0, 0);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const wd of wasteData) {
      const recipe = recipes[wd.recipe];
      if (!recipe) continue;

      const qtyBaked = isWeekend ? wd.weekendBaked  : wd.weekdayBaked;
      const qtySold  = isWeekend ? wd.weekendSold   : wd.weekdayScold;

      await prisma.wasteLog.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          date:     date,
          qtyBaked,
          qtySold,
        },
      });
    }
  }

  console.log("✅ Seeded Flour & Salt Bakery");
  console.log(`   Tenant:      ${tenant.id}`);
  console.log(`   User:        ${user.email}`);
  console.log(`   Ingredients: ${Object.keys(ingredients).length}`);
  console.log(`   Products:    ${Object.keys(recipes).length}`);
  console.log(`   Waste logs:  ${30 * wasteData.length} entries (30 days × ${wasteData.length} products)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
