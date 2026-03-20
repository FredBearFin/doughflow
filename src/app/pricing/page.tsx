/**
 * Pricing page — /pricing
 *
 * Simple single-tier pricing page. DoughFlow is a flat monthly fee —
 * no per-user pricing, no feature tiers. Everything included.
 *
 * Server Component — no interactivity needed.
 */

import Link from "next/link";

export default function PricingPage() {
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
          <Link href="/pricing" className="text-sm text-stone-600 font-medium">Pricing</Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 rounded-lg bg-amber-500 px-5 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-8 pt-20 pb-10 text-center">
        <h1 className="text-4xl font-bold text-stone-900 mb-4">
          Simple, flat pricing
        </h1>
        <p className="text-lg text-stone-500">
          One plan. Every feature. No surprises.
        </p>
      </section>

      {/* Pricing card */}
      <section className="max-w-md mx-auto px-8 pb-20">
        <div className="rounded-2xl bg-white border-2 border-amber-400 shadow-lg p-8">
          {/* Plan name + badge */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">Bakery Plan</h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              Most popular
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-5xl font-bold text-stone-900">$49</span>
            <span className="text-stone-400 ml-1">/month</span>
            <p className="text-sm text-stone-400 mt-1">14-day free trial · No credit card required</p>
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors mb-8"
          >
            Start free trial
          </Link>

          {/* Feature list */}
          <ul className="space-y-3 text-sm text-stone-600">
            {[
              "Daily demand forecast for every product",
              "Ingredient feasibility check",
              "Digital pantry with low-stock alerts",
              "Bill of materials for every product",
              "End-of-day waste logging",
              "Waste analytics + dollar cost tracking",
              "Unlimited ingredients and products",
              "Unlimited team members",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span className="text-amber-500 font-bold mt-0.5">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-10 space-y-6">
          {[
            {
              q: "What happens after the trial?",
              a: "We'll reach out before your trial ends. No automatic charges — you choose when to subscribe.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. No contracts, no cancellation fees. Cancel whenever you want.",
            },
            {
              q: "Do I need to enter a credit card to start?",
              a: "No. Sign up with Google and start using DoughFlow immediately. No payment info required.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium text-stone-900 mb-1">{q}</p>
              <p className="text-sm text-stone-500">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-stone-400 border-t border-stone-100">
        © 2026 DoughFlow · Built for bakeries
      </footer>
    </div>
  );
}
