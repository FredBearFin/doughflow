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
    COTTAGE_MONTHLY: process.env.STRIPE_PRICE_COTTAGE_MONTHLY ?? "",
    COTTAGE_ANNUAL:  process.env.STRIPE_PRICE_COTTAGE_ANNUAL  ?? "",
    BAKER_MONTHLY:   process.env.STRIPE_PRICE_BAKER_MONTHLY   ?? "",
    BAKER_ANNUAL:    process.env.STRIPE_PRICE_BAKER_ANNUAL    ?? "",
    // Artisan — kept in code but not shown on pricing page yet
    ARTISAN_MONTHLY: process.env.STRIPE_PRICE_ARTISAN_MONTHLY ?? "",
    ARTISAN_ANNUAL:  process.env.STRIPE_PRICE_ARTISAN_ANNUAL  ?? "",
  };
}

/** Map a Stripe Price ID back to a DoughFlow tier (used by the webhook). */
export function tierForPriceId(priceId: string): "COTTAGE" | "BAKER" | "ARTISAN" | null {
  const ids = getPriceIds();
  switch (priceId) {
    case ids.COTTAGE_MONTHLY:
    case ids.COTTAGE_ANNUAL:  return "COTTAGE";
    case ids.BAKER_MONTHLY:
    case ids.BAKER_ANNUAL:    return "BAKER";
    case ids.ARTISAN_MONTHLY:
    case ids.ARTISAN_ANNUAL:  return "ARTISAN";
    default:                   return null;
  }
}
