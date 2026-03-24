/**
 * Stripe client singleton — src/lib/stripe.ts
 *
 * Same HMR-safe singleton pattern as prisma.ts.
 * In dev, Next.js hot-reloads wipe the module cache, so without the global
 * guard we'd recreate the Stripe client (and re-read the secret key) on every
 * file save.  In production modules evaluate once — the guard is a no-op.
 *
 * Usage (server-side only):
 *   import { stripe } from "@/lib/stripe";
 *   const session = await stripe.checkout.sessions.create({ ... });
 *
 * The publishable key lives in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and is
 * used directly on the client (pricing page redirect) — it doesn't need a
 * module-level singleton.
 */

import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover", // pinned to the installed SDK's default
    typescript: true,
  });

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;

// ── Price ID helpers ──────────────────────────────────────────────────────────
// Read once at module initialisation so every route gets a consistent value.
// All four must be set in .env.local / Vercel env before billing goes live.

export const PRICE_IDS = {
  COTTAGE_MONTHLY:  process.env.STRIPE_PRICE_COTTAGE_MONTHLY  ?? "",
  BAKER_MONTHLY:    process.env.STRIPE_PRICE_BAKER_MONTHLY    ?? "",
  ARTISAN_MONTHLY:  process.env.STRIPE_PRICE_ARTISAN_MONTHLY  ?? "",
  ARTISAN_ANNUAL:   process.env.STRIPE_PRICE_ARTISAN_ANNUAL   ?? "",
} as const;

/** Map a Stripe Price ID back to a DoughFlow tier (used by the webhook). */
export function tierForPriceId(priceId: string): "COTTAGE" | "BAKER" | "ARTISAN" | null {
  switch (priceId) {
    case PRICE_IDS.COTTAGE_MONTHLY:  return "COTTAGE";
    case PRICE_IDS.BAKER_MONTHLY:    return "BAKER";
    case PRICE_IDS.ARTISAN_MONTHLY:  return "ARTISAN";
    case PRICE_IDS.ARTISAN_ANNUAL:   return "ARTISAN";
    default:                          return null;
  }
}
