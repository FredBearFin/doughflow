/**
 * Public landing page — /
 *
 * Marketing home page for DoughFlow.
 * Server Component — no client interactivity needed here.
 */

import Link from "next/link";

const FEATURES = [
  {
    emoji: "📈",
    color: "from-emerald-400 to-teal-500",
    title: "Demand Forecast",
    desc: "See what sold last Tuesday and the four before it. Get a suggested bake qty for today — automatically.",
  },
  {
    emoji: "✅",
    color: "from-amber-400 to-orange-500",
    title: "Ingredient Feasibility",
    desc: "Before you bake 30 sourdough loaves, know if you have enough flour. DoughFlow checks your pantry against the forecast.",
  },
  {
    emoji: "📦",
    color: "from-blue-400 to-indigo-500",
    title: "Digital Pantry",
    desc: "Real-time stock levels for every ingredient. Color-coded low-stock alerts before you run out mid-bake.",
  },
  {
    emoji: "📋",
    color: "from-violet-400 to-purple-500",
    title: "Bill of Materials",
    desc: "Define what goes into each product. When you log a bake, ingredient stock updates automatically.",
  },
  {
    emoji: "🗑️",
    color: "from-rose-400 to-red-500",
    title: "Waste Logging",
    desc: "End-of-day takes 60 seconds. Log what you baked and what you sold — the app tracks the rest.",
  },
  {
    emoji: "📊",
    color: "from-sky-400 to-cyan-500",
    title: "Waste Analytics",
    desc: "See which products waste the most, which days are worst, and the dollar cost of what you throw away.",
  },
];

const STATS = [
  { value: "60 sec", label: "to log end of day" },
  { value: "10–15%", label: "avg waste for home bakers" },
  { value: "6 weeks", label: "free trial, no card" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-stone-100"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            <span className="text-white font-black text-base">D</span>
          </div>
          <span className="font-bold text-stone-900 text-lg tracking-tight">DoughFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden sm:inline-flex text-sm text-stone-500 hover:text-stone-800 font-medium px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 rounded-lg px-4 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-amber-200 active:scale-95"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, #FEF3C7 0%, #FFFBEB 30%, #FFFFFF 70%)",
        }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, #D6D3D1 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 md:px-10 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 mb-8 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Stop baking blind
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-stone-900 leading-[1.05] tracking-tight mb-6">
            Know what to bake
            <br />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              before Saturday&apos;s market.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            DoughFlow learns your demand patterns and tells you exactly what to bake each week —
            built for home bakers, cottage food sellers, and farmers market vendors who want to
            sell out without throwing away unsold product.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-14 rounded-xl px-8 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-200 active:scale-95"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
            >
              Start your 6-week free trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center h-14 rounded-xl border border-stone-200 bg-white px-8 text-base font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              See pricing →
            </Link>
          </div>
          <p className="text-sm text-stone-400 font-medium">
            6 weeks free · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <section className="border-y border-stone-100 bg-stone-50">
        <div className="max-w-3xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">{s.value}</div>
              <div className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
            From data to bake plan in seconds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

          {[
            {
              step: "01",
              title: "Log your bakes",
              desc: "After each market, record what you baked and sold in 60 seconds. That's it.",
            },
            {
              step: "02",
              title: "DoughFlow learns",
              desc: "The algorithm analyses your sales patterns by day of week, recipe, and seasonal events.",
            },
            {
              step: "03",
              title: "Get your bake plan",
              desc: "Every morning you get an exact count of what to bake today, checked against your pantry stock.",
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center md:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-sm mb-5 shadow-lg shadow-amber-200">
                {item.step}
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">{item.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, #FEF3C7 0%, #FAFAF9 60%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
              Everything in one dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white border border-stone-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <div
                  className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl mb-4 shadow-sm`}
                >
                  {f.emoji}
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI CTA section ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24"
        style={{
          background: "linear-gradient(135deg, #1C1917 0%, #292524 50%, #1C1917 100%)",
        }}
      >
        {/* Amber glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 100%, #F59E0B 0%, transparent 70%)",
          }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, #FFFFFF 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-2xl mx-auto text-center px-6">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-6 text-2xl shadow-xl"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            🥖
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Less waste.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Every single day.
            </span>
          </h2>
          <p className="text-stone-400 text-lg mb-10 leading-relaxed">
            Most home bakers throw away 10–15% of what they bake. DoughFlow pays for itself in
            the first week of waste reduction.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 rounded-xl px-10 text-base font-bold text-stone-900 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)" }}
          >
            Start your 6-week free trial
          </Link>
          <p className="text-stone-500 text-sm mt-4 font-medium">
            No credit card · Full access · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-stone-950 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
            >
              <span className="text-white font-black text-xs">D</span>
            </div>
            <span className="text-stone-400 font-semibold text-sm">DoughFlow</span>
          </div>
          <p className="text-stone-600 text-xs text-center">
            © 2026 DoughFlow · Built for home bakers, cottage food sellers &amp; market vendors
          </p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-stone-500 hover:text-stone-300 text-xs font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-stone-500 hover:text-stone-300 text-xs font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
