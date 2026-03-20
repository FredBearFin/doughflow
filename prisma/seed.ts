/**
 * Prisma seed script — populates a demo bakery for local development.
 *
 * All quantities use US bakery units:
 *   LB  — pounds      (bulk dry goods: flour, sugar, butter)
 *   OZ  — ounces      (salt, yeast, cream cheese, small quantities)
 *   FL_OZ — fluid oz  (milk, oil, other liquids)
 *   EACH — count      (eggs)
 *
 * Seeds 12 ingredients, 8 products with BOMs, and 30 days of waste history
 * so the demand forecast panel has enough same-day-of-week data to work.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo bakery (US units)...");

  // ─── Wipe existing data ───────────────────────────────────────────────────
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
    data: { name: "Flour & Salt Bakery", slug: "flour-and-salt", plan: "ACTIVE" },
  });

  // ─── Demo user ────────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: { email: "owner@flourandsalt.com", name: "Sam Baker", emailVerified: new Date() },
  });
  await prisma.tenantUser.create({
    data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
  });

  // ─── Ingredients ─────────────────────────────────────────────────────────
  // stock / reorderPoint are in the ingredient's own unit.
  // costPerUnit is in USD per 1 unit (e.g. $0.89/lb bread flour).
  const ingredientData = [
    // Dry goods — by the pound
    { name: "Bread Flour",   unit: "LB",    stock: 50,   reorderPt: 10,  cost: 0.89 },
    { name: "AP Flour",      unit: "LB",    stock: 25,   reorderPt: 5,   cost: 0.79 },
    { name: "Rye Flour",     unit: "LB",    stock: 10,   reorderPt: 2,   cost: 1.29 },
    { name: "Oats",          unit: "LB",    stock: 5,    reorderPt: 1,   cost: 0.99 },
    { name: "Sugar",         unit: "LB",    stock: 25,   reorderPt: 5,   cost: 0.69 },
    // Small dry goods — by the ounce
    { name: "Salt",          unit: "OZ",    stock: 32,   reorderPt: 8,   cost: 0.04 },
    { name: "Instant Yeast", unit: "OZ",    stock: 8,    reorderPt: 2,   cost: 0.55 },
    // Dairy & fat — by the pound
    { name: "Butter",        unit: "LB",    stock: 10,   reorderPt: 2,   cost: 4.49 },
    // Dairy — by the fluid ounce
    { name: "Whole Milk",    unit: "FL_OZ", stock: 128,  reorderPt: 32,  cost: 0.07 },
    // By the ounce
    { name: "Cream Cheese",  unit: "OZ",    stock: 32,   reorderPt: 8,   cost: 0.37 },
    // Liquid — by the fluid ounce
    { name: "Olive Oil",     unit: "FL_OZ", stock: 64,   reorderPt: 16,  cost: 0.25 },
    // Count
    { name: "Eggs",          unit: "EACH",  stock: 120,  reorderPt: 24,  cost: 0.35 },
  ] as const;

  const ingredients: Record<string, { id: string }> = {};
  for (const ing of ingredientData) {
    const created = await prisma.ingredient.create({
      data: {
        tenantId:     tenant.id,
        name:         ing.name,
        unit:         ing.unit,
        currentStock: ing.stock,
        reorderPoint: ing.reorderPt,
        costPerUnit:  ing.cost,
      },
    });
    ingredients[ing.name] = created;
  }

  // ─── Products / Recipes ───────────────────────────────────────────────────
  // All BOM quantities are in the ingredient's own unit.
  // Conversions from metric originals (approximate):
  //   1 kg flour  ≈ 2.2 lb      |  1 lb  = 16 oz
  //   1 cup milk  ≈ 8 fl oz     |  100g butter ≈ 3.5 oz ≈ 0.22 lb
  const recipeData = [
    {
      name:  "Sourdough Loaf",
      desc:  "Classic long-ferment sourdough",
      batch: 2,  // 2 loaves per batch
      lines: [
        { name: "Bread Flour",   qty: 2    },  // 2 lb
        { name: "Salt",          qty: 0.7  },  // 0.7 oz
        { name: "Instant Yeast", qty: 0.07 },  // 0.07 oz (~2g)
      ],
    },
    {
      name:  "Croissant",
      desc:  "Laminated butter croissant",
      batch: 12,
      lines: [
        { name: "AP Flour",      qty: 1    },  // 1 lb
        { name: "Butter",        qty: 0.66 },  // 0.66 lb (~10.5 oz)
        { name: "Sugar",         qty: 0.11 },  // 0.11 lb (~1.75 oz)
        { name: "Salt",          qty: 0.35 },  // 0.35 oz
        { name: "Instant Yeast", qty: 0.28 },  // 0.28 oz
        { name: "Whole Milk",    qty: 7    },  // 7 fl oz
      ],
    },
    {
      name:  "Bagel",
      desc:  "NY-style boiled bagel",
      batch: 12,
      lines: [
        { name: "Bread Flour",   qty: 1.3  },  // 1.3 lb
        { name: "Salt",          qty: 0.4  },  // 0.4 oz
        { name: "Instant Yeast", qty: 0.2  },  // 0.2 oz
        { name: "Sugar",         qty: 0.04 },  // 0.04 lb
      ],
    },
    {
      name:  "Cinnamon Roll",
      desc:  "Soft enriched cinnamon roll with cream cheese frosting",
      batch: 9,
      lines: [
        { name: "AP Flour",      qty: 0.88 },  // 0.88 lb
        { name: "Butter",        qty: 0.22 },  // 0.22 lb (~3.5 oz)
        { name: "Sugar",         qty: 0.18 },  // 0.18 lb (~2.8 oz)
        { name: "Salt",          qty: 0.18 },  // 0.18 oz
        { name: "Instant Yeast", qty: 0.25 },  // 0.25 oz
        { name: "Whole Milk",    qty: 6    },  // 6 fl oz
        { name: "Cream Cheese",  qty: 4    },  // 4 oz
        { name: "Eggs",          qty: 2    },  // 2 each
      ],
    },
    {
      name:  "Focaccia",
      desc:  "Roman-style olive oil focaccia",
      batch: 4,
      lines: [
        { name: "Bread Flour",   qty: 1.1  },  // 1.1 lb
        { name: "Salt",          qty: 0.35 },  // 0.35 oz
        { name: "Instant Yeast", qty: 0.14 },  // 0.14 oz
        { name: "Olive Oil",     qty: 3    },  // 3 fl oz
      ],
    },
    {
      name:  "Baguette",
      desc:  "Traditional French baguette",
      batch: 6,
      lines: [
        { name: "Bread Flour",   qty: 1.3  },  // 1.3 lb
        { name: "Salt",          qty: 0.4  },  // 0.4 oz
        { name: "Instant Yeast", qty: 0.18 },  // 0.18 oz
      ],
    },
    {
      name:  "Chocolate Chip Cookie",
      desc:  "Brown butter chocolate chip cookies",
      batch: 24,
      lines: [
        { name: "AP Flour", qty: 0.62 },  // 0.62 lb
        { name: "Butter",   qty: 0.49 },  // 0.49 lb (~7.8 oz)
        { name: "Sugar",    qty: 0.44 },  // 0.44 lb (~7 oz)
        { name: "Salt",     qty: 0.18 },  // 0.18 oz
        { name: "Eggs",     qty: 2    },  // 2 each
      ],
    },
    {
      name:  "Cream Cheese Danish",
      desc:  "Flaky danish with cream cheese filling",
      batch: 8,
      lines: [
        { name: "AP Flour",      qty: 0.77 },  // 0.77 lb (~12.3 oz)
        { name: "Butter",        qty: 0.44 },  // 0.44 lb (~7 oz)
        { name: "Sugar",         qty: 0.13 },  // 0.13 lb (~2 oz)
        { name: "Salt",          qty: 0.18 },  // 0.18 oz
        { name: "Instant Yeast", qty: 0.2  },  // 0.2 oz
        { name: "Whole Milk",    qty: 4    },  // 4 fl oz
        { name: "Cream Cheese",  qty: 7    },  // 7 oz
        { name: "Eggs",          qty: 1    },  // 1 each
      ],
    },
  ];

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
  const wasteData = [
    { recipe: "Sourdough Loaf",        weekdayBaked: 6,  weekdaySold: 5,  weekendBaked: 14, weekendSold: 12 },
    { recipe: "Croissant",             weekdayBaked: 22, weekdaySold: 18, weekendBaked: 36, weekendSold: 30 },
    { recipe: "Bagel",                 weekdayBaked: 28, weekdaySold: 24, weekendBaked: 40, weekendSold: 36 },
    { recipe: "Cinnamon Roll",         weekdayBaked: 14, weekdaySold: 12, weekendBaked: 26, weekendSold: 22 },
    { recipe: "Focaccia",              weekdayBaked: 8,  weekdaySold: 6,  weekendBaked: 12, weekendSold: 10 },
    { recipe: "Baguette",              weekdayBaked: 16, weekdaySold: 14, weekendBaked: 24, weekendSold: 20 },
    { recipe: "Chocolate Chip Cookie", weekdayBaked: 36, weekdaySold: 30, weekendBaked: 54, weekendSold: 48 },
    { recipe: "Cream Cheese Danish",   weekdayBaked: 10, weekdaySold: 8,  weekendBaked: 18, weekendSold: 16 },
  ];

  const today = new Date();
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const wd of wasteData) {
      const recipe = recipes[wd.recipe];
      if (!recipe) continue;
      await prisma.wasteLog.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          date,
          qtyBaked: isWeekend ? wd.weekendBaked : wd.weekdayBaked,
          qtySold:  isWeekend ? wd.weekendSold  : wd.weekdaySold,
        },
      });
    }
  }

  console.log("✅ Seeded Flour & Salt Bakery (US units)");
  console.log(`   Ingredients: ${Object.keys(ingredients).length}`);
  console.log(`   Products:    ${Object.keys(recipes).length}`);
  console.log(`   Waste logs:  ${30 * wasteData.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
