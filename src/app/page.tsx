/**
 * Public landing page — /
 *
 * The marketing home page for DoughFlow, shown to unauthenticated visitors.
 * Provides a brief product pitch with a clear call-to-action (CTA) to start
 * a free trial by navigating to /login.
 *
 * Structure:
 *   1. Nav bar — logo + Pricing link + "Get Started Free" CTA button
 *   2. Hero section — tagline, sub-copy, dual CTA buttons, trial disclaimer
 *   3. Feature grid — 6 product feature cards (icon, title, one-line description)
 *   4. ROI CTA section — amber background, bold value proposition, sign-up button
 *   5. Footer — copyright notice
 *
 * This is a Server Component (no "use client" directive). Static HTML is
 * sufficient here — there is no client interactivity, and rendering on the
 * server improves Time To First Byte and SEO.
 */

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top navigation bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-stone-900">DoughFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
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

      {/* Hero section */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Stop baking blind
        </div>
        <h1 className="text-5xl font-bold text-stone-900 leading-tight mb-6">
          Know what to bake.<br />
          <span className="text-amber-500">Before you fire the oven.</span>
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-8">
          DoughFlow learns your bakery&apos;s demand patterns and tells you exactly what to bake each
          morning — so you sell out without throwing away unsold product at close.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 rounded-xl bg-amber-500 px-8 text-base font-semibold text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center h-14 rounded-xl border border-stone-200 bg-white px-8 text-base font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-stone-400 mt-4">No credit card · 14-day free trial</p>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "📈",
              title: "Demand Forecast",
              desc: "See what sold last Tuesday and the four before it. Get a suggested bake qty for today — automatically.",
            },
            {
              icon: "✅",
              title: "Ingredient Feasibility",
              desc: "Before you bake 50 croissants, know if you have enough butter. DoughFlow checks your pantry against the forecast.",
            },
            {
              icon: "📦",
              title: "Digital Pantry",
              desc: "Real-time stock levels for every ingredient. Color-coded low-stock alerts before you run out mid-bake.",
            },
            {
              icon: "📋",
              title: "Bill of Materials",
              desc: "Define what goes into each product. When you log a bake, ingredient stock updates automatically.",
            },
            {
              icon: "🗑️",
              title: "Waste Logging",
              desc: "End-of-day takes 60 seconds. Log what you baked and what you sold — the app tracks the rest.",
            },
            {
              icon: "📊",
              title: "Waste Analytics",
              desc: "See which products waste the most, which days are worst, and the dollar cost of what you throw away.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white border border-stone-200 p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-stone-900 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="bg-amber-500 py-16">
        <div className="max-w-2xl mx-auto text-center px-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Less waste. Every single day.
          </h2>
          <p className="text-amber-100 mb-8">
            Most bakeries throw away 10–15% of what they bake. DoughFlow pays for itself
            in the first week of waste reduction.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 rounded-xl bg-white px-8 text-base font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
          >
            Start your free trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-stone-400">
        © 2026 DoughFlow · Built for bakeries
      </footer>
    </div>
  );
}
