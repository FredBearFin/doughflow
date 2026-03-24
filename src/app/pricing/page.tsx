"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ChefHat, Sparkles } from "lucide-react";

type Billing = "monthly" | "annual";

// ─── Feature list ─────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { text: "3 recipes",                              included: true  },
  { text: "3 pantry ingredients",                   included: true  },
  { text: "Batch cost calculator",                  included: true  },
  { text: "Manual stock tracking",                  included: true  },
  { text: "Bake Plan / demand forecast",            included: false },
  { text: "Waste logging",                          included: false },
  { text: "Analytics & charts",                     included: false },
  { text: "Suggested retail pricing",               included: false },
  { text: "CSV & PDF export",                       included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited recipes & ingredients",        highlight: true  },
  { text: "Bake Plan — know what to bake Saturday", highlight: true  },
  { text: "End-of-day waste logging",               highlight: false },
  { text: "COGS per recipe",                        highlight: false },
  { text: "Analytics & waste charts",               highlight: false },
  { text: "Suggested retail pricing",               highlight: false },
  { text: "CSV import & export",                    highlight: false },
  { text: "PDF exports (no watermark)",             highlight: false },
  { text: "Low-stock alerts",                       highlight: false },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Is the free plan actually free?",
    a: "Yes, forever. No credit card, no expiry. You keep your 3 recipes and 3 ingredients as long as you want.",
  },
  {
    q: "What is the Bake Plan?",
    a: "Your weekly production forecast. DoughFlow analyses your sales history and tells you exactly what to bake before market day — by recipe, by quantity. It's the core reason people upgrade.",
  },
  {
    q: "How does annual billing work?",
    a: "Pay $99 upfront for a full year — that's effectively one month free compared to paying $9/mo for 12 months ($108). You can switch between monthly and annual at any time.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Nothing is deleted. You'll lose access to Pro features but all your recipes, logs, and history stay intact. Upgrade again any time to get it all back.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings at any time. No questions, no lock-in.",
  },
  {
    q: "Do you charge per user?",
    a: "No. One account, one price.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const isAnnual = billing === "annual";

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
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-10 rounded-lg bg-amber-500 px-5 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
        >
          Get Started Free
        </Link>
      </nav>

      {/* Header */}
      <section className="max-w-2xl mx-auto px-8 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold text-stone-900 mb-3">
          Free, or everything.
        </h1>
        <p className="text-lg text-stone-500 mb-2">
          Start free, upgrade when you need more.
        </p>
        <p className="text-sm text-stone-400">
          No credit card required. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-8 rounded-full border border-stone-200 bg-white p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              billing === "annual" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Annual
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
              1 month free
            </span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-3xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Free card */}
          <div className="rounded-2xl bg-white border border-stone-100 p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-stone-400 mb-1">Free</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="text-stone-400 text-sm mb-1">/ forever</span>
              </div>
              <p className="text-sm text-stone-400">
                Get a feel for the app. No card, no expiry.
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm">
                  {f.included
                    ? <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    : <X     className="h-4 w-4 shrink-0 mt-0.5 text-stone-200" />
                  }
                  <span className={f.included ? "text-stone-600" : "text-stone-300"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
            >
              Start for free
            </Link>
          </div>

          {/* Pro card */}
          <div className="relative rounded-2xl bg-white border-2 border-amber-400 shadow-lg shadow-amber-100 p-7 flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="h-3 w-3" />
                Everything unlocked
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-amber-600 mb-1">Pro</p>
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-4xl font-bold text-stone-900">
                  {isAnnual ? "$99" : "$9"}
                </span>
                <span className="text-stone-400 text-sm mb-1">
                  {isAnnual ? "/ year" : "/ mo"}
                </span>
              </div>
              {isAnnual && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    1 month free
                  </span>
                  <span className="text-xs text-stone-400">= $8.25/mo</span>
                </div>
              )}
              <p className="text-sm text-stone-500 mt-1">
                Everything you need to run your baking business.
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {PRO_FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm">
                  <Check className={`h-4 w-4 shrink-0 mt-0.5 ${f.highlight ? "text-amber-500" : "text-green-500"}`} />
                  <span className={f.highlight ? "text-stone-900 font-medium" : "text-stone-600"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Get started free →
            </Link>
            <p className="text-center text-xs text-stone-400 mt-2">
              Free plan first, upgrade inside the app
            </p>
          </div>

        </div>

        <p className="text-center text-sm text-stone-400 mt-8">
          Not sure? Start free — you&apos;ll know when you need more.
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
