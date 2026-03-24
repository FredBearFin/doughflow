/**
 * Stripe client — src/lib/stripe.ts
 *
 * IMPORTANT: the client is initialised LAZILY via getStripe().
 *
 * Why not a module-level singleton like prisma.ts?
 * Next.js evaluates server-side modules at build time when collecting page
 * data.  `new Stripe(key)` throws immediately if `key` is falsy — which it
 * is during a Vercel build before env vars are applied at runtime.
 * A lazy getter defers construction until the first actual HTTP request, so
 * builds succeed even when STRIPE_SECRET_KEY is not in the build environment.
 *
 * Usage (server-side only):
 *   import { getStripe } from "@/lib/stripe";
 *   const session = await getStripe().checkout.sessions.create({ ... });
 */

import Stripe from "stripe";

let _stripe: Stripe | undefined;

/**
 * Returns the shared Stripe client, creating it on the first call.
 * Throws a clear error at request time if STRIPE_SECRET_KEY is missing
 * rather than silently failing or crashing the build.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local and your Vercel environment variables."
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-02-25.clover", // pinned to installed SDK default
    typescript: true,
  });

  return _stripe;
}

// ── Price ID helpers ──────────────────────────────────────────────────────────
// Read at call time (not module load) so they're always current.

export function getPriceIds() {
  return {
    PAID_MONTHLY: process.env.STRIPE_PRICE_PAID_MONTHLY ?? "",
    PAID_ANNUAL:  process.env.STRIPE_PRICE_PAID_ANNUAL  ?? "",
  };
}

/**
 * Map a Stripe Price ID back to a DB tier value (used by the webhook).
 * Both Pro billing intervals map to "BAKER" in the DB — the single
 * "paid" state stored against the legacy enum.
 */
export function tierForPriceId(priceId: string): "BAKER" | null {
  const ids = getPriceIds();
  switch (priceId) {
    case ids.PAID_MONTHLY:
    case ids.PAID_ANNUAL:  return "BAKER";
    default:               return null;
  }
}
