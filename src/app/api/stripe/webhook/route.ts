/**
 * POST /api/stripe/webhook
 *
 * Receives and verifies Stripe webhook events, then updates the
 * user_subscriptions table in response to billing lifecycle changes.
 *
 * Events handled:
 *   customer.subscription.created  → upsert subscription (tier + status + dates)
 *   customer.subscription.updated  → upsert subscription (handles upgrades, renewals)
 *   customer.subscription.deleted  → set tier=FREE, status=CANCELED
 *   invoice.payment_failed         → set status=PAST_DUE
 *
 * User resolution order:
 *   1. subscription.metadata.userId  (written by /api/stripe/checkout)
 *   2. DB lookup by stripeCustomerId (fallback for portal-initiated changes)
 *
 * Setup:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   Set STRIPE_WEBHOOK_SECRET to the secret shown by `stripe listen`.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, tierForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Next.js App Router: disable body parsing so we can pass the raw buffer
// to Stripe's signature verifier.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig           = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature header or STRIPE_WEBHOOK_SECRET env var" },
      { status: 400 }
    );
  }

  // Read the raw body — required for Stripe's HMAC verification.
  const rawBody = await req.arrayBuffer();
  const buf     = Buffer.from(rawBody);

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${String(err)}` },
      { status: 400 }
    );
  }

  // ── Route to handler ──────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        // Silently ignore unhandled event types.
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the DoughFlow userId from a Stripe Subscription object. */
async function getUserIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  // Preferred: metadata written at checkout time.
  if (sub.metadata?.userId) return sub.metadata.userId;

  // Fallback: look up the customer in our DB.
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const row = await prisma.subscription.findFirst({
    where:  { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return row?.userId ?? null;
}

/** Maps Stripe subscription statuses to our DB enum values. */
type DbStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

const STRIPE_TO_DB_STATUS: Record<string, DbStatus> = {
  active:             "ACTIVE",
  trialing:           "TRIALING",
  past_due:           "PAST_DUE",
  canceled:           "CANCELED",
  incomplete:         "INCOMPLETE",
  incomplete_expired: "CANCELED",
  unpaid:             "PAST_DUE",
  paused:             "ACTIVE",
};

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(sub);
  if (!userId) {
    console.warn("[stripe/webhook] could not resolve userId for subscription", sub.id);
    return;
  }

  const priceId    = sub.items.data[0]?.price?.id ?? "";
  const tier       = tierForPriceId(priceId) ?? "FREE";
  const status     = STRIPE_TO_DB_STATUS[sub.status] ?? "ACTIVE";
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd        = sub.items.data[0]?.current_period_end;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

  await prisma.subscription.upsert({
    where:  { userId },
    update: {
      tier,
      status,
      stripeCustomerId:     customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd,
    },
    create: {
      userId,
      tier,
      status,
      stripeCustomerId:     customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd,
    },
  });

  console.log(`[stripe/webhook] upserted subscription for user ${userId}: tier=${tier} status=${status}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(sub);
  if (!userId) {
    console.warn("[stripe/webhook] could not resolve userId for deleted subscription", sub.id);
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data:  { tier: "FREE", status: "CANCELED", currentPeriodEnd: null },
  });

  console.log(`[stripe/webhook] subscription deleted for user ${userId} — downgraded to FREE`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const row = await prisma.subscription.findFirst({
    where:  { stripeCustomerId: customerId },
    select: { userId: true },
  });
  if (!row) return;

  await prisma.subscription.update({
    where: { userId: row.userId },
    data:  { status: "PAST_DUE" },
  });

  console.log(`[stripe/webhook] payment failed for user ${row.userId} — status set to PAST_DUE`);
}
