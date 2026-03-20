/**
 * NextAuth.js catch-all route handler — /api/auth/[...nextauth]
 *
 * This file is the standard NextAuth v5 (Auth.js) integration point for the
 * Next.js App Router. It re-exports the GET and POST handlers produced by
 * the `NextAuth(...)` configuration in src/lib/auth.ts.
 *
 * NextAuth routes handled by this catch-all include:
 *   GET  /api/auth/session       — return current session JSON
 *   GET  /api/auth/csrf          — return CSRF token
 *   GET  /api/auth/providers     — list configured providers
 *   GET  /api/auth/signin        — redirect to sign-in page
 *   GET  /api/auth/signout       — sign out the current user
 *   GET  /api/auth/callback/:provider — OAuth callback
 *   GET  /api/auth/verify-request     — magic-link verification landing
 *   POST /api/auth/signin/:provider   — credential sign-in submission
 *   POST /api/auth/signout            — sign-out submission
 *
 * All configuration (providers, adapter, session strategy, callbacks) is
 * centralised in src/lib/auth.ts to keep this file minimal.
 */

import { handlers } from "@/lib/auth";

// Re-export GET and POST from the auth handlers.
// Named exports are required by the Next.js App Router for route handlers.
export const { GET, POST } = handlers;
