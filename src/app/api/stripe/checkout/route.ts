/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session and returns the hosted payment URL.
 *
 * Request body:
 *   { tier: string, billing?: "monthly" | "annual" }
 *
 * The tier param is accepted for routing clarity; both "pro" and any legacy
 * value map to the single paid price (BAKER in the DB).
 * billing defaults to "monthly".
 *
 * Returns { url } — the client redirects there immediately.
 * The webhook handles the actual DB tier upgrade once payment succeeds.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceIds } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId    = session.user.id;
  const userEmail = session.user.email;

  // ── Parse body ────────────────────────────────────────────────────────────
  let billing: string = "monthly";
  try {
    const body = await req.json();
    if (body?.billing === "annual") billing = "annual";
  } catch {
    // body is optional — defaults are fine
  }

  // ── Resolve priceId ───────────────────────────────────────────────────────
  const priceIds = getPriceIds();
  const priceId  = billing === "annual" ? priceIds.PAID_ANNUAL : priceIds.PAID_MONTHLY;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_PRICE_PAID_MONTHLY / PAID_ANNUAL." },
      { status: 500 }
    );
  }

  // ── Find or create Stripe Customer ────────────────────────────────────────
  const existingSub = await prisma.subscription.findUnique({
    where:  { userId },
    select: { stripeCustomerId: true },
  });

  let stripeCustomerId = existingSub?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email:    userEmail,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;

    await prisma.subscription.upsert({
      where:  { userId },
      update: { stripeCustomerId },
      create: { userId, stripeCustomerId, tier: "FREE", status: "ACTIVE" },
    });
  }

  // ── Create Checkout Session ───────────────────────────────────────────────
  const origin      = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const checkoutSession = await getStripe().checkout.sessions.create({
    customer:            stripeCustomerId,
    mode:                "subscription",
    line_items:          [{ price: priceId, quantity: 1 }],
    success_url:         `${origin}/settings?upgraded=1`,
    cancel_url:          `${origin}/pricing`,
    client_reference_id: userId,
    subscription_data:   { metadata: { userId } },
    // Pre-fill email only for first-time checkout
    customer_email:      existingSub?.stripeCustomerId ? undefined : userEmail,
    allow_promotion_codes: true,
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
