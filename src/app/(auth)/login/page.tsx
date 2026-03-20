/**
 * Login page for DoughFlow.
 *
 * This is the entry point for unauthenticated users. It supports three
 * authentication methods:
 *   1. Google OAuth — one-click sign-in via the Google provider.
 *   2. Magic link (Resend) — passwordless email sign-in. A sign-in link is
 *      emailed to the user; clicking it completes authentication.
 *   3. Dev credentials — only available in development mode, allowing instant
 *      sign-in as a seed user without needing a working email service.
 *
 * The page is split into two components so that `useSearchParams` (which
 * requires Suspense in Next.js 13+) can be used inside `LoginContent` while
 * keeping the exported page component safe for static rendering.
 */

"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * LoginContent renders the actual login UI. It is wrapped in a <Suspense>
 * boundary in the exported default because `useSearchParams` suspends.
 */
function LoginContent() {
  // Check whether we arrived here after sending a magic link (?verify=1)
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify") === "1";

  // Local state for the email input and async loading/sent flags
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  /** True after a magic link has been dispatched, shows the confirmation screen */
  const [sent, setSent] = useState(false);

  /**
   * Handles the email magic-link form submission.
   * Calls NextAuth's signIn with the "resend" provider, which triggers Resend
   * to send a sign-in email. We pass redirect:false so that we control the UX
   * ourselves (show the "link sent" state) instead of letting NextAuth redirect.
   */
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("resend", { email, redirect: false });
    setLoading(false);
    setSent(true);
  };

  /**
   * Initiates Google OAuth sign-in.
   * After successful authentication the user is redirected to /overview.
   */
  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/overview" });
  };

  /**
   * Development-only shortcut: signs in as the seed bakery owner without
   * needing a real email flow. Only rendered when NODE_ENV === "development".
   */
  const handleDevLogin = async () => {
    setLoading(true);
    await signIn("dev", { email: "owner@flourandsalt.com", callbackUrl: "/" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-3 shadow-lg">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">DoughFlow</h1>
          <p className="text-stone-500 text-sm mt-1">Lean inventory for bakeries</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          {/*
           * Three possible UI states:
           *   verify — user clicked a magic link and arrived via ?verify=1
           *   sent    — user just submitted the email form in this session
           *   default — the actual sign-in form
           */}
          {verify ? (
            /* Arrived via the ?verify=1 redirect that NextAuth appends to the
               verifyRequest page. Show a "check your email" prompt. */
            <div className="text-center">
              <div className="text-4xl mb-3">✉️</div>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Check your email</h2>
              <p className="text-stone-500 text-sm">
                We&apos;ve sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
            </div>
          ) : sent ? (
            /* User just sent a magic link from within this component instance */
            <div className="text-center">
              <div className="text-4xl mb-3">✉️</div>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Magic link sent!</h2>
              <p className="text-stone-500 text-sm">Check your inbox at {email}</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-stone-900 mb-6">Sign in</h2>

              {/* Google OAuth button */}
              <Button
                onClick={handleGoogle}
                variant="outline"
                className="w-full mb-4 gap-3"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Visual divider between OAuth and email options */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs text-stone-400 bg-white px-2">
                  or
                </div>
              </div>

              {/*
               * Dev-only shortcut — only rendered in development.
               * This bypasses email entirely and signs in as the seed owner account
               * so developers can test the app without setting up Resend or Google.
               */}
              {process.env.NODE_ENV === "development" && (
                <Button
                  onClick={handleDevLogin}
                  variant="outline"
                  className="w-full mb-4 gap-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50"
                  disabled={loading}
                >
                  ⚡ Dev Login (Sam Baker)
                </Button>
              )}

              {/* Magic-link email form */}
              <form onSubmit={handleEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@bakery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {/* Disable submit if already loading or email is empty */}
                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? "Sending…" : "Send magic link"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          No credit card required during trial
        </p>
      </div>
    </div>
  );
}

/**
 * Default export — the Next.js page component.
 * Wraps LoginContent in Suspense because useSearchParams() requires it
 * (Next.js 13 App Router rule: any component reading search params must
 * be inside a Suspense boundary during static rendering).
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
