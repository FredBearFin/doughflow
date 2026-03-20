"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ChefHat } from "lucide-react";

type Billing = "monthly" | "annual";

// ─── Tier data ────────────────────────────────────────────────────────────────

type Feature = { text: string; included: boolean; highlight?: boolean };

interface Tier {
  name: string;
  price: { monthly: string; annual?: string };
  annualNote?: string;
  description: string;
  cta: string;
  popular?: boolean;
  muted?: boolean;
  features: Feature[];
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: { monthly: "$0" },
    description: "Get a feel for the app. No card needed, no expiry.",
    cta: "Get started free",
    muted: true,
    features: [
      { text: "3 recipes", included: true },
      { text: "3 pantry ingredients", included: true },
      { text: "Manual stock adjust", included: true },
      { text: "Batch cost calculator (screen only)", included: true },
      { text: "Bake Plan / demand forecast", included: false },
      { text: "Waste tracking", included: false },
      { text: "COGS per recipe", included: false },
      { text: "Exports of any kind", included: false },
    ],
  },
  {
    name: "Cottage",
    price: { monthly: "$6" },
    description: "For sellers who want to bake smarter before market day.",
    cta: "Start with Cottage",
    features: [
      { text: "10 recipes", included: true },
      { text: "25 pantry ingredients", included: true },
      { text: "Bake Plan — know what to bake before Saturday", included: true, highlight: true },
      { text: "Basic waste logging", included: true },
      { text: "COGS per recipe", included: true },
      { text: "1 sales channel / market", included: true },
      { text: "CSV import / export", included: false },
      { text: "Analytics & charts", included: false },
      { text: "PDF exports", included: false },
    ],
  },
  {
    name: "Baker",
    price: { monthly: "$14" },
    description: "For growing sellers who need unlimited scale and real analytics.",
    cta: "Start with Baker",
    popular: true,
    features: [
      { text: "Unlimited recipes & ingredients", included: true },
      { text: "Everything in Cottage", included: true },
      { text: "Up to 3 sales channels / markets", included: true },
      { text: "CSV import & export", included: true },
      { text: "Suggested retail pricing", included: true },
      { text: "Analytics & charts", included: true },
      { text: "PDF exports (no watermark)", included: true },
      { text: "Orders & customer tracking", included: true },
      { text: "Low-stock alerts", included: true },
    ],
  },
  {
    name: "Artisan",
    price: { monthly: "$29", annual: "$290" },
    annualNote: "2 months free",
    description: "For serious sellers running a real operation.",
    cta: "Start with Artisan",
    features: [
      { text: "Everything in Baker", included: true },
      { text: "Unlimited sales channels / markets", included: true },
      { text: "Supplier price tracker", included: true },
      { text: "2 staff / helper accounts", included: true },
      { text: "White-labeled order forms", included: true },
      { text: "Advanced forecast (per-market breakdown)", included: true },
      { text: "Priority support", included: true },
      { text: "Early access features", included: true },
    ],
  },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Is the free plan actually free?",
    a: "Yes, forever. No credit card required, no expiry date. You keep your 3 recipes and 3 ingredients for as long as you want.",
  },
  {
    q: "What happens when I hit the free plan limits?",
    a: "You'll see an upgrade prompt the moment you try to add a 4th recipe or ingredient. Your existing data is never deleted or locked.",
  },
  {
    q: "What is the Bake Plan?",
    a: "Your weekly production forecast. DoughFlow analyses your sales history and tells you exactly what to bake before market day — by recipe, by quantity. It's the core reason people upgrade from Free to Cottage.",
  },
  {
    q: "Can I downgrade after upgrading?",
    a: "Yes. Your data stays intact — you'll just lose access to paid features above your plan's limits. Nothing is deleted.",
  },
  {
    q: "Does Artisan offer annual billing?",
    a: "Yes — $290/year saves you two months compared to monthly billing ($348/year). You can switch at any time.",
  },
  {
    q: "What counts as a sales channel?",
    a: "Each place you sell counts as one channel — a farmers market, an online shop, a café account, a farm stand. Cottage covers one; Baker covers three; Artisan is unlimited.",
  },
  {
    q: "Do you charge per user?",
    a: "No. Free, Cottage, and Baker are all single-user. Artisan includes 2 staff / helper accounts.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-stone-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-stone-900">DoughFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
            Pricing
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 rounded-lg bg-amber-500 px-5 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold text-stone-900 mb-3">
          Simple, honest pricing.
        </h1>
        <p className="text-lg text-stone-500 mb-2">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <p className="text-sm text-stone-400">
          No credit card required on the free plan. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-8 rounded-full border border-stone-200 bg-white p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              billing === "annual"
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Annual
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
              Save 17%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const isAnnualArtisan = billing === "annual" && tier.annualNote;
            const price = isAnnualArtisan ? tier.price.annual! : tier.price.monthly;
            const period = tier.price.monthly === "$0"
              ? "forever"
              : isAnnualArtisan
              ? "/ year"
              : "/ mo";

            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl bg-white p-6 flex flex-col ${
                  tier.popular
                    ? "border-2 border-amber-400 shadow-lg shadow-amber-100"
                    : tier.muted
                    ? "border border-stone-100"
                    : "border border-stone-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className={`text-sm font-semibold mb-1 ${tier.muted ? "text-stone-400" : "text-stone-600"}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-stone-900">{price}</span>
                    <span className="text-stone-400 text-sm mb-1">{period}</span>
                  </div>
                  {isAnnualArtisan && tier.annualNote && (
                    <p className="text-xs text-amber-600 font-medium">{tier.annualNote}</p>
                  )}
                  <p className={`text-sm mt-2 ${tier.muted ? "text-stone-400" : "text-stone-500"}`}>
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            f.highlight ? "text-amber-500" : "text-green-500"
                          }`}
                        />
                      ) : (
                        <X className="h-4 w-4 shrink-0 mt-0.5 text-stone-200" />
                      )}
                      <span
                        className={
                          !f.included
                            ? "text-stone-300"
                            : f.highlight
                            ? "text-stone-900 font-medium"
                            : "text-stone-600"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold transition-colors ${
                    tier.popular
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : tier.muted
                      ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Reassurance note */}
        <p className="text-center text-sm text-stone-400 mt-8">
          Not sure? The free plan never expires. You&apos;ll know when you need more.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-10">
          Common questions
        </h2>
        <div className="space-y-6">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="border-b border-stone-100 pb-6 last:border-0">
              <p className="font-semibold text-stone-900 mb-1.5">{q}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-500 py-16">
        <div className="max-w-2xl mx-auto text-center px-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 mb-4">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Start free. Bake smarter.
          </h2>
          <p className="text-amber-100 mb-8 text-sm">
            No credit card. No expiry. Just a better way to prep for market day.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 rounded-xl bg-white px-8 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-stone-400">
        © 2026 DoughFlow · Built for home bakers, cottage food sellers &amp; market vendors
      </footer>
    </div>
  );
}
