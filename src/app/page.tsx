import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
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

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          For home bakers, cottage sellers &amp; market vendors
        </div>
        <h1 className="text-5xl font-bold text-stone-900 leading-tight mb-6">
          Know what to bake<br />
          <span className="text-amber-500">before Saturday&apos;s market.</span>
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-8">
          DoughFlow is the baking brain for home bakers, cottage food sellers, and farmers
          market vendors. Know your real cost per batch, track what you have, and never
          over-prep or run out again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 rounded-xl bg-amber-500 px-8 text-base font-semibold text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center h-14 rounded-xl border border-stone-200 bg-white px-8 text-base font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-stone-400 mt-4">Free forever · No credit card required</p>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "📦",
              title: "Digital Pantry",
              desc: "Know exactly what you have before you bake 30 sourdough loaves for Saturday. Color-coded alerts before you run short.",
            },
            {
              icon: "🧮",
              title: "Real Cost per Recipe",
              desc: "See the actual cost per batch — flour, butter, eggs, packaging. Know your real margin before you set your market price.",
            },
            {
              icon: "📅",
              title: "Bake Plan",
              desc: "DoughFlow looks at your sales history and tells you exactly what to prep before market day. Stop over-baking. Stop running out.",
            },
            {
              icon: "📋",
              title: "Ingredient Tracking",
              desc: "Log a sale and every ingredient is automatically deducted from your pantry — down to yield loss. No more manual spreadsheets.",
            },
            {
              icon: "🗑️",
              title: "Waste Tracking",
              desc: "Log what didn't sell at Saturday's market. See your real waste cost per week and bake smarter next time.",
            },
            {
              icon: "📊",
              title: "Market Analytics",
              desc: "Best-selling products, waste trends, revenue by market day. Know what's working before you prep for next weekend.",
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

      {/* CTA */}
      <section className="bg-amber-500 py-16">
        <div className="max-w-2xl mx-auto text-center px-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Stop guessing. Start selling smarter.
          </h2>
          <p className="text-amber-100 mb-8">
            Built for home bakers, cottage food sellers, and farmers market vendors who are serious about their numbers.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 rounded-xl bg-white px-8 text-base font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
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
