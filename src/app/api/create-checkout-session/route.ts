/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout session for a plan upgrade and returns the
 * hosted payment URL.  The client immediately redirects to that URL.
 *
 * Request body:
 *   { priceId: string }   — a Stripe price_XXXX ID (one of our 4 plan prices)
 *
 * Flow:
 *   1. Verify the user is authenticated.
 *   2. Look up (or create) a Stripe Customer for this user so their payment
 *      methods and invoices are attached to a consistent customer record.
 *   3. Persist the Stripe Customer ID back to `user_subscriptions` so the
 *      billing portal route and the webhook can find it later.
 *   4. Create the Checkout Session in `subscription` mode.
 *   5. Return { url } — the client redirects there.
 *
 * Success URL: /settings?upgraded=1  (shows a "Thanks for upgrading!" banner)
 * Cancel URL:  /pricing              (user can try again or compare plans)
 *
 * The webhook (Part 7) handles the actual DB tier upgrade once payment
 * succeeds — this route only creates the payment session.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId    = session.user.id;
  const userEmail = session.user.email;

  // ── Parse + validate body ─────────────────────────────────────────────────
  let priceId: string;
  try {
    const body = await req.json();
    priceId = body?.priceId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!priceId || typeof priceId !== "string" || !priceId.startsWith("price_")) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  // ── Find or create Stripe Customer ───────────────────────────────────────
  // We look up the existing subscription row first.  If a stripeCustomerId is
  // already stored we reuse it so the customer's payment history is preserved.
  const existingSub = await prisma.subscription.findUnique({
    where:  { userId },
    select: { stripeCustomerId: true },
  });

  let stripeCustomerId = existingSub?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    // First checkout — create a new Customer in Stripe
    const customer = await getStripe().customers.create({
      email:    userEmail,
      metadata: { userId },           // lets us look the user up from a customer ID
    });
    stripeCustomerId = customer.id;

    // Persist it immediately so the portal route and webhook can find it,
    // even if the user abandons the checkout.
    await prisma.subscription.upsert({
      where:  { userId },
      update: { stripeCustomerId },
      create: {
        userId,
        stripeCustomerId,
        tier:   "FREE",
        status: "ACTIVE",
      },
    });
  }

  // ── Build absolute URLs ────────────────────────────────────────────────────
  // Works in both local dev (http://localhost:3000) and production (https://…)
  const origin     = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const successUrl = `${origin}/settings?upgraded=1`;
  const cancelUrl  = `${origin}/pricing`;

  // ── Create Checkout Session ───────────────────────────────────────────────
  const checkoutSession = await getStripe().checkout.sessions.create({
    customer:              stripeCustomerId,
    mode:                  "subscription",
    line_items: [
      { price: priceId, quantity: 1 },
    ],
    success_url:           successUrl,
    cancel_url:            cancelUrl,
    // client_reference_id lets the webhook match payment → user without a
    // database lookup in case stripeCustomerId metadata ever gets out of sync.
    client_reference_id:   userId,
    // Embed userId in subscription metadata — the webhook reads this to know
    // which DoughFlow user to upgrade.
    subscription_data: {
      metadata: { userId },
    },
    // Pre-fill the email so the checkout form is one step faster.
    customer_email: existingSub?.stripeCustomerId ? undefined : userEmail,
    // Allow promo codes (free to add, low risk at this stage).
    allow_promotion_codes: true,
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
