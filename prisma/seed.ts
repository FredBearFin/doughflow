import { PrismaClient } from "@prisma/client";
import { explodeBOM } from "../src/lib/bom";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo bakery...");

  // Clean up
  await prisma.$transaction([
    prisma.inventoryLedger.deleteMany(),
    prisma.wasteLog.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.purchaseOrderLine.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.recipeIngredient.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.ingredient.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.tenantUser.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ─── Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name: "Flour & Salt Bakery",
      slug: "flour-and-salt",
      plan: "ACTIVE",
    },
  });

  // ─── Demo User ───────────────────────────────────────────────────────────
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

  // ─── Suppliers ───────────────────────────────────────────────────────────
  const cityMill = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: "City Mill Supply",
      email: "orders@citymill.com",
      phone: "555-0101",
    },
  });

  const dairyDirect = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: "Dairy Direct",
      email: "orders@dairydirect.com",
      phone: "555-0202",
    },
  });

  // ─── Ingredients (12) ────────────────────────────────────────────────────
  const ingredientData = [
    // Dry goods — City Mill
    { name: "Bread Flour", unit: "GRAM", stock: 25000, reorderPt: 5000, reorderQty: 20000, leadTime: 3, cost: 0.002, supplierId: cityMill.id },
    { name: "AP Flour", unit: "GRAM", stock: 18000, reorderPt: 4000, reorderQty: 15000, leadTime: 3, cost: 0.0018, supplierId: cityMill.id },
    { name: "Rye Flour", unit: "GRAM", stock: 8000, reorderPt: 2000, reorderQty: 8000, leadTime: 3, cost: 0.0025, supplierId: cityMill.id },
    { name: "Oats", unit: "GRAM", stock: 5000, reorderPt: 1000, reorderQty: 5000, leadTime: 3, cost: 0.003, supplierId: cityMill.id },
    { name: "Sugar", unit: "GRAM", stock: 12000, reorderPt: 2000, reorderQty: 10000, leadTime: 3, cost: 0.0022, supplierId: cityMill.id },
    { name: "Salt", unit: "GRAM", stock: 3000, reorderPt: 500, reorderQty: 3000, leadTime: 3, cost: 0.0005, supplierId: cityMill.id },
    { name: "Instant Yeast", unit: "GRAM", stock: 500, reorderPt: 100, reorderQty: 500, leadTime: 3, cost: 0.015, supplierId: cityMill.id },
    { name: "Olive Oil", unit: "MILLILITER", stock: 3000, reorderPt: 500, reorderQty: 3000, leadTime: 3, cost: 0.006, supplierId: cityMill.id },
    // Dairy — Dairy Direct
    { name: "Butter", unit: "GRAM", stock: 4000, reorderPt: 800, reorderQty: 4000, leadTime: 2, cost: 0.009, supplierId: dairyDirect.id },
    { name: "Eggs", unit: "EACH", stock: 120, reorderPt: 24, reorderQty: 120, leadTime: 2, cost: 0.35, supplierId: dairyDirect.id },
    { name: "Whole Milk", unit: "MILLILITER", stock: 5000, reorderPt: 1000, reorderQty: 5000, leadTime: 2, cost: 0.0013, supplierId: dairyDirect.id },
    { name: "Cream Cheese", unit: "GRAM", stock: 2000, reorderPt: 400, reorderQty: 2000, leadTime: 2, cost: 0.012, supplierId: dairyDirect.id },
  ] as const;

  const ingredients: Record<string, any> = {};
  for (const ing of ingredientData) {
    const created = await prisma.ingredient.create({
      data: {
        tenantId: tenant.id,
        name: ing.name,
        unit: ing.unit as any,
        currentStock: ing.stock,
        reorderPoint: ing.reorderPt,
        reorderQty: ing.reorderQty,
        leadTimeDays: ing.leadTime,
        costPerUnit: ing.cost,
        supplierId: ing.supplierId,
      },
    });
    // Opening ledger
    await prisma.inventoryLedger.create({
      data: {
        tenantId: tenant.id,
        ingredientId: created.id,
        qty: ing.stock,
        reason: "OPENING",
        note: "Opening stock — seed",
      },
    });
    ingredients[ing.name] = created;
  }

  // ─── Recipes (8) ─────────────────────────────────────────────────────────
  const recipeData = [
    {
      name: "Sourdough Loaf",
      desc: "Classic long-ferment sourdough",
      batch: 2,
      yield: 0.90,
      price: 9.00,
      lines: [
        { name: "Bread Flour", qty: 1000 },
        { name: "Salt", qty: 20 },
        { name: "Instant Yeast", qty: 2 },
      ],
    },
    {
      name: "Croissant",
      desc: "Laminated butter croissant",
      batch: 12,
      yield: 0.92,
      price: 4.50,
      lines: [
        { name: "AP Flour", qty: 500 },
        { name: "Butter", qty: 300 },
        { name: "Sugar", qty: 50 },
        { name: "Salt", qty: 10 },
        { name: "Instant Yeast", qty: 8 },
        { name: "Whole Milk", qty: 200 },
      ],
    },
    {
      name: "Bagel",
      desc: "NY-style boiled bagel",
      batch: 12,
      yield: 0.95,
      price: 2.25,
      lines: [
        { name: "Bread Flour", qty: 600 },
        { name: "Salt", qty: 12 },
        { name: "Instant Yeast", qty: 6 },
        { name: "Sugar", qty: 20 },
      ],
    },
    {
      name: "Cinnamon Roll",
      desc: "Soft enriched cinnamon roll with cream cheese frosting",
      batch: 9,
      yield: 0.93,
      price: 5.00,
      lines: [
        { name: "AP Flour", qty: 400 },
        { name: "Butter", qty: 100 },
        { name: "Sugar", qty: 80 },
        { name: "Salt", qty: 5 },
        { name: "Instant Yeast", qty: 7 },
        { name: "Whole Milk", qty: 180 },
        { name: "Cream Cheese", qty: 120 },
        { name: "Eggs", qty: 2 },
      ],
    },
    {
      name: "Focaccia",
      desc: "Roman-style olive oil focaccia",
      batch: 4,
      yield: 0.93,
      price: 8.00,
      lines: [
        { name: "Bread Flour", qty: 500 },
        { name: "Salt", qty: 10 },
        { name: "Instant Yeast", qty: 4 },
        { name: "Olive Oil", qty: 80 },
      ],
    },
    {
      name: "Baguette",
      desc: "Traditional French baguette",
      batch: 6,
      yield: 0.88,
      price: 3.50,
      lines: [
        { name: "Bread Flour", qty: 600 },
        { name: "Salt", qty: 12 },
        { name: "Instant Yeast", qty: 5 },
      ],
    },
    {
      name: "Chocolate Chip Cookie",
      desc: "Brown butter chocolate chip cookies",
      batch: 24,
      yield: 0.97,
      price: 2.75,
      lines: [
        { name: "AP Flour", qty: 280 },
        { name: "Butter", qty: 220 },
        { name: "Sugar", qty: 200 },
        { name: "Salt", qty: 5 },
        { name: "Eggs", qty: 2 },
      ],
    },
    {
      name: "Cream Cheese Danish",
      desc: "Flaky danish with cream cheese filling",
      batch: 8,
      yield: 0.91,
      price: 5.50,
      lines: [
        { name: "AP Flour", qty: 350 },
        { name: "Butter", qty: 200 },
        { name: "Sugar", qty: 60 },
        { name: "Salt", qty: 5 },
        { name: "Instant Yeast", qty: 6 },
        { name: "Whole Milk", qty: 120 },
        { name: "Cream Cheese", qty: 200 },
        { name: "Eggs", qty: 1 },
      ],
    },
  ];

  const recipes: Record<string, any> = {};
  for (const r of recipeData) {
    const created = await prisma.recipe.create({
      data: {
        tenantId: tenant.id,
        name: r.name,
        description: r.desc,
        batchSize: r.batch,
        yieldPct: r.yield,
        sellingPrice: r.price,
        ingredients: {
          create: r.lines.map((l) => ({
            ingredientId: ingredients[l.name].id,
            quantity: l.qty,
          })),
        },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
    recipes[r.name] = created;
  }

  // ─── 30 days of sales ────────────────────────────────────────────────────
  const salesData = [
    { recipe: "Sourdough Loaf", weekday: 5, weekend: 12 },
    { recipe: "Croissant", weekday: 18, weekend: 30 },
    { recipe: "Bagel", weekday: 24, weekend: 36 },
    { recipe: "Cinnamon Roll", weekday: 12, weekend: 22 },
    { recipe: "Focaccia", weekday: 6, weekend: 10 },
    { recipe: "Baguette", weekday: 14, weekend: 20 },
    { recipe: "Chocolate Chip Cookie", weekday: 30, weekend: 48 },
    { recipe: "Cream Cheese Danish", weekday: 8, weekend: 16 },
  ];

  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const sd of salesData) {
      const qty = isWeekend ? sd.weekend : sd.weekday;
      const recipe = recipes[sd.recipe];
      if (!recipe) continue;

      const sale = await prisma.sale.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          qty,
          revenue: qty * recipe.sellingPrice,
          source: "MANUAL",
          soldAt: date,
        },
      });

      // Deduct ingredients
      const consumption = explodeBOM(recipe, qty);
      for (const [ingredientId, consumed] of consumption) {
        await prisma.inventoryLedger.create({
          data: {
            tenantId: tenant.id,
            ingredientId,
            qty: -consumed,
            reason: "PRODUCTION",
            refId: sale.id,
          },
        });
      }
    }
  }

  // ─── 7 days of waste logs ────────────────────────────────────────────────
  const wasteEntries = [
    { ingredient: "AP Flour", qty: 300, reason: "Spilled", daysAgo: 6 },
    { ingredient: "Butter", qty: 200, reason: "Left out overnight", daysAgo: 5 },
    { ingredient: "Cream Cheese", qty: 150, reason: "Expired", daysAgo: 4 },
    { ingredient: "Eggs", qty: 4, reason: "Dropped", daysAgo: 3 },
    { ingredient: "Whole Milk", qty: 500, reason: "Sour", daysAgo: 2 },
    { ingredient: "Bread Flour", qty: 200, reason: "Contaminated", daysAgo: 1 },
    { ingredient: "Instant Yeast", qty: 20, reason: "Old batch", daysAgo: 0 },
  ];

  for (const w of wasteEntries) {
    const date = new Date(today);
    date.setDate(today.getDate() - w.daysAgo);
    const ing = ingredients[w.ingredient];
    if (!ing) continue;

    await prisma.wasteLog.create({
      data: {
        tenantId: tenant.id,
        ingredientId: ing.id,
        qty: w.qty,
        reason: w.reason,
        createdAt: date,
      },
    });
    await prisma.inventoryLedger.create({
      data: {
        tenantId: tenant.id,
        ingredientId: ing.id,
        qty: -w.qty,
        reason: "WASTE",
        note: w.reason,
        createdAt: date,
      },
    });
  }

  // ─── 3 draft purchase orders ─────────────────────────────────────────────
  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      supplierId: cityMill.id,
      status: "DRAFT",
      totalCost: 20000 * 0.002 + 15000 * 0.0018,
      lines: {
        create: [
          { ingredientId: ingredients["Bread Flour"].id, qty: 20000, unitCost: 0.002 },
          { ingredientId: ingredients["AP Flour"].id, qty: 15000, unitCost: 0.0018 },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      supplierId: dairyDirect.id,
      status: "SENT",
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expectedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      totalCost: 4000 * 0.009 + 2000 * 0.012,
      lines: {
        create: [
          { ingredientId: ingredients["Butter"].id, qty: 4000, unitCost: 0.009 },
          { ingredientId: ingredients["Cream Cheese"].id, qty: 2000, unitCost: 0.012 },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      supplierId: cityMill.id,
      status: "RECEIVED",
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      totalCost: 3000 * 0.0005,
      lines: {
        create: [
          { ingredientId: ingredients["Salt"].id, qty: 3000, unitCost: 0.0005, receivedQty: 3000 },
        ],
      },
    },
  });

  console.log(`✅ Seeded Flour & Salt Bakery`);
  console.log(`   Tenant: ${tenant.id}`);
  console.log(`   User: ${user.email}`);
  console.log(`   ${Object.keys(ingredients).length} ingredients`);
  console.log(`   ${Object.keys(recipes).length} recipes`);
  console.log(`   30 days of sales history`);
  console.log(`   7 waste log entries`);
  console.log(`   3 purchase orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
