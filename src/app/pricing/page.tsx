"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ChefHat, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";

type Billing = "monthly" | "annual";

// ─── Feature lists ────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { text: "3 recipes", included: true },
  { text: "3 pantry ingredients", included: true },
  { text: "Batch cost calculator", included: true },
  { text: "Manual stock tracking", included: true },
  { text: "Bake Plan / demand forecast", included: false },
  { text: "Waste logging", included: false },
  { text: "Analytics & charts", included: false },
  { text: "Suggested retail pricing", included: false },
  { text: "CSV & PDF export", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited recipes & ingredients", highlight: true },
  { text: "Bake Plan — know what to bake Saturday", highlight: true },
  { text: "End-of-day waste logging", highlight: false },
  { text: "COGS per recipe", highlight: false },
  { text: "Analytics & waste charts", highlight: false },
  { text: "Suggested retail pricing", highlight: false },
  { text: "CSV import & export", highlight: false },
  { text: "PDF exports (no watermark)", highlight: false },
  { text: "Low-stock alerts", highlight: false },
];

const FAQ = [
  {
    q: "What is the 6-week free trial?",
    a: "Every new account gets 6 weeks of full Pro access — Bake Plan, waste logging, analytics, everything. No credit card required. After 6 weeks you choose: pay $9/mo to keep it all, or drop to the limited free plan.",
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
    q: "What happens when my trial ends?",
    a: "You drop to the limited free plan — 3 recipes, 3 ingredients, no Bake Plan or waste logging. Your data stays completely intact. Upgrade any time to get it all back instantly.",
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

const VALUE_PROPS = [
  {
    icon: Zap,
    title: "Up in 5 minutes",
    desc: "Add your products, log a bake, get your first forecast the next day.",
  },
  {
    icon: BarChart3,
    title: "Pays for itself fast",
    desc: "One avoided batch of waste covers a whole month of Pro.",
  },
  {
    icon: Shield,
    title: "Your data, always",
    desc: "Cancel anytime — your bake history stays yours, no questions asked.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const isAnnual = billing === "annual";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-stone-100"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            <span className="text-white font-black text-base">D</span>
          </div>
          <span className="font-bold text-stone-900 text-lg tracking-tight">DoughFlow</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-9 rounded-lg px-4 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-amber-200 active:scale-95"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
        >
          Get Started Free
        </Link>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, #FEF3C7 0%, #FFFBEB 30%, #FFFFFF 70%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, #D6D3D1 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            6 weeks free, then $9/mo
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Simple, honest pricing.
          </h1>
          <p className="text-lg text-stone-500 mb-2 leading-relaxed">
            Every new account gets a full 6-week trial — no credit card, no limits.
          </p>
          <p className="text-sm text-stone-400">
            After your trial, keep everything you love for $9/mo or drop to the free plan.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-8 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Annual
              <span className="text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                −8%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16 -mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Free card */}
          <div className="rounded-2xl bg-white border border-stone-200 p-7 flex flex-col shadow-sm">
            <div className="mb-7">
              <p className="text-xs font-bold tracking-widest uppercase text-stone-400 mb-3">Free</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-5xl font-black text-stone-900">$0</span>
                <span className="text-stone-400 text-sm mb-1.5 font-medium">/ forever</span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">
                What you drop to after your 6-week trial — unless you upgrade.
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  {f.included ? (
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                      <X className="h-3 w-3 text-stone-300" />
                    </span>
                  )}
                  <span className={f.included ? "text-stone-700" : "text-stone-300"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Start your free trial
            </Link>
          </div>

          {/* Pro card */}
          <div
            className="relative rounded-2xl p-7 flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)",
              border: "2px solid #F59E0B",
              boxShadow: "0 20px 60px -10px rgba(245, 158, 11, 0.3), 0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            {/* Popular badge */}
            <div
              className="absolute -top-0 right-6 px-3 py-1 rounded-b-xl text-xs font-bold text-white flex items-center gap-1"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
            >
              <Sparkles className="h-3 w-3" />
              Everything unlocked
            </div>

            <div className="mb-7 mt-4">
              <p className="text-xs font-bold tracking-widest uppercase text-amber-700 mb-3">Pro</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-black text-stone-900">
                  {isAnnual ? "$99" : "$9"}
                </span>
                <span className="text-stone-600 text-sm mb-1.5 font-medium">
                  {isAnnual ? "/ year" : "/ mo"}
                </span>
              </div>
              {isAnnual && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                    Save $9 vs monthly
                  </span>
                  <span className="text-xs text-stone-500">= $8.25/mo</span>
                </div>
              )}
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                Everything in your trial, kept forever.
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                      f.highlight ? "bg-amber-400" : "bg-green-100"
                    }`}
                  >
                    <Check className={`h-3 w-3 ${f.highlight ? "text-white" : "text-green-600"}`} />
                  </span>
                  <span className={f.highlight ? "text-stone-900 font-semibold" : "text-stone-700"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-bold text-white transition-all hover:shadow-xl hover:shadow-amber-300/50 hover:-translate-y-0.5 active:scale-95"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
            >
              Start your 6-week free trial →
            </Link>
            <p className="text-center text-xs text-amber-700/60 mt-2.5 font-medium">
              No credit card · Full access for 6 weeks
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-stone-400 mt-8">
          Not sure? Start your 6-week trial — no card needed, cancel anytime.
        </p>
      </section>

      {/* ── Value props ─────────────────────────────────────────────────── */}
      <section className="border-y border-stone-100 bg-stone-50 py-12">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-stone-900 mb-1">{title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">Common questions</h2>
        </div>
        <div className="space-y-0">
          {FAQ.map(({ q, a }, i) => (
            <div
              key={q}
              className={`py-6 ${i < FAQ.length - 1 ? "border-b border-stone-100" : ""}`}
            >
              <p className="font-bold text-stone-900 mb-2 leading-snug">{q}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          background: "linear-gradient(135deg, #1C1917 0%, #292524 50%, #1C1917 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 100%, #F59E0B 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-lg mx-auto text-center px-6">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-6 shadow-xl"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            <ChefHat className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            Start free. Bake smarter.
          </h2>
          <p className="text-stone-400 mb-8 leading-relaxed">
            No credit card. No expiry. Just a better way to prep for market day.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-13 rounded-xl px-8 text-sm font-bold text-stone-900 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)", height: "52px" }}
          >
            Get started free →
          </Link>
        </div>
      </section>

      <footer className="bg-stone-950 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
          <Link href="/" className="text-stone-500 hover:text-stone-300 text-xs font-medium transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
