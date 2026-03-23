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
          Pricing that grows with your bakery
        </h1>
        <p className="text-lg text-stone-500">
          Start free. Upgrade when you need more.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Starter */}
          <div className="rounded-2xl bg-white border border-stone-200 p-7">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Starter</h2>
            <p className="text-sm text-stone-400 mb-5">Solo baker or home operation</p>
            <div className="mb-5">
              <span className="text-4xl font-bold text-stone-900">$9</span>
              <span className="text-stone-400 ml-1">/month</span>
            </div>
            <Link
              href="/login"
              className="block w-full text-center h-11 leading-[2.75rem] rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors mb-6 text-sm"
            >
              Start free trial
            </Link>
            <ul className="space-y-2.5 text-sm text-stone-600">
              {["Up to 10 products", "Demand forecast", "Pantry & low-stock alerts", "End-of-day logging"].map((f) => (
                <li key={f} className="flex items-start gap-2"><span className="text-amber-500 font-bold">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          {/* Pro — highlighted */}
          <div className="rounded-2xl bg-white border-2 border-amber-400 shadow-lg p-7 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-amber-500 text-white px-3 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="text-lg font-bold text-stone-900 mb-1">Pro</h2>
            <p className="text-sm text-stone-400 mb-5">Small bakery, farmers market, café</p>
            <div className="mb-5">
              <span className="text-4xl font-bold text-stone-900">$29</span>
              <span className="text-stone-400 ml-1">/month</span>
            </div>
            <Link
              href="/login"
              className="block w-full text-center h-11 leading-[2.75rem] rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors mb-6 text-sm"
            >
              Start free trial
            </Link>
            <ul className="space-y-2.5 text-sm text-stone-600">
              {[
                "Unlimited products",
                "Demand forecast + event overrides",
                "Waste analytics + dollar cost tracking",
                "Ingredient feasibility check",
                "Pantry & low-stock alerts",
                "Bill of materials per product",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2"><span className="text-amber-500 font-bold">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          {/* Scale */}
          <div className="rounded-2xl bg-white border border-stone-200 p-7">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Scale</h2>
            <p className="text-sm text-stone-400 mb-5">Multi-location or wholesale</p>
            <div className="mb-5">
              <span className="text-4xl font-bold text-stone-900">$39</span>
              <span className="text-stone-400 ml-1">/month</span>
            </div>
            <Link
              href="/login"
              className="block w-full text-center h-11 leading-[2.75rem] rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors mb-6 text-sm"
            >
              Start free trial
            </Link>
            <ul className="space-y-2.5 text-sm text-stone-600">
              {[
                "Everything in Pro",
                "Multiple locations",
                "Team member accounts",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2"><span className="text-amber-500 font-bold">✓</span>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-stone-400 mb-10">14-day free trial on all plans · No credit card required</p>

        {/* FAQ */}
        <div className="max-w-xl mx-auto space-y-6">
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
