/**
 * POST /api/create-portal-session
 *
 * Creates a Stripe Billing Portal session so a subscriber can manage their
 * own subscription (upgrade, downgrade, cancel, update payment method,
 * download invoices) without us building any of that UI ourselves.
 *
 * Prerequisites:
 *   - The user must be authenticated.
 *   - A `stripeCustomerId` must exist in `user_subscriptions` (it is written
 *     there the first time a checkout session is created).
 *
 * Returns:
 *   { url: string }  — the portal URL; the client redirects there.
 *
 * The portal return URL is /settings so the user lands back on their account
 * page after finishing in the portal.
 *
 * Note: The Stripe Billing Portal must be configured in the Stripe Dashboard
 * (Settings → Billing → Customer portal) before this will work.  The
 * minimum config is: enable the portal, set the return URL, and allow
 * subscription cancellation.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // ── Look up stripeCustomerId ───────────────────────────────────────────────
  const sub = await prisma.subscription.findUnique({
    where:  { userId },
    select: { stripeCustomerId: true },
  });

  if (!sub?.stripeCustomerId) {
    // User has never started a checkout — no customer record exists yet.
    // The client should show the pricing page instead of calling this route.
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 404 }
    );
  }

  // ── Build return URL ───────────────────────────────────────────────────────
  const origin    = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const returnUrl = `${origin}/settings`;

  // ── Create Billing Portal Session ─────────────────────────────────────────
  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
