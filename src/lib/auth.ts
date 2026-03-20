/**
 * NextAuth (Auth.js v5) configuration — src/lib/auth.ts
 *
 * This is the central authentication configuration for DoughFlow. It wires up
 * three authentication providers, the Prisma adapter for session persistence,
 * and JWT callbacks that inject the user's database ID into the session token.
 *
 * Authentication providers:
 *
 *   1. Google OAuth
 *      Sign in with a Google account. Requires GOOGLE_CLIENT_ID and
 *      GOOGLE_CLIENT_SECRET environment variables.
 *
 *   2. Resend (magic links)
 *      Passwordless email sign-in via the Resend transactional email service.
 *      A sign-in link is emailed to the user; clicking it completes auth.
 *      Only included when RESEND_API_KEY is set — skipped gracefully in
 *      environments where Resend is not configured (e.g. local dev without
 *      a Resend account). FROM_EMAIL controls the sender address.
 *
 *   3. Dev Credentials (development only)
 *      A credentials provider that signs in any existing user by email without
 *      any password or email verification. Only active when NODE_ENV === "development"
 *      so it is guaranteed to be absent in production builds.
 *
 * Session strategy: JWT
 *   Sessions are stored as signed JWTs in browser cookies rather than in the
 *   database. This avoids the need for a `Session` table lookup on every request.
 *   The user's database ID is added to the token in the `jwt` callback so it is
 *   available in `session.user.id` throughout the application.
 *
 * trustHost: true
 *   Required for deployment behind Vercel's reverse proxy. Without this flag
 *   NextAuth rejects requests because the host header doesn't match the expected
 *   value. See: https://authjs.dev/reference/nextjs#trusthost
 *
 * Pages:
 *   signIn      → /login    (custom login page)
 *   verifyRequest → /login?verify=1  (shown after a magic link is sent)
 *
 * Exports:
 *   handlers — GET/POST route handler functions for /api/auth/[...nextauth]
 *   auth     — server-side session accessor (used in layouts and API routes)
 *   signIn   — programmatic sign-in helper (not used server-side in this app)
 *   signOut  — programmatic sign-out helper (used in the Sidebar component)
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

/**
 * Dev-only credentials provider.
 * Defined as a conditional array so it can be spread into the providers list.
 * Returns an empty array in production, meaning the provider doesn't exist.
 *
 * The authorize function looks up the user by email and returns the user record
 * if found. NextAuth handles the session creation from there.
 */
const devProvider =
  process.env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "dev",
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            if (!credentials?.email) return null;
            // Look up an existing user by the provided email address
            const user = await prisma.user.findUnique({
              where: { email: credentials.email as string },
            });
            return user; // null if not found — NextAuth treats null as auth failure
          },
        }),
      ]
    : [];

/**
 * NextAuth configuration and export.
 * Destructured into named exports so each consumer imports only what it needs.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Prisma adapter stores OAuth accounts, users, and sessions in the database
  adapter: PrismaAdapter(prisma),

  // JWT strategy — sessions are cookies, not DB rows
  session: { strategy: "jwt" },

  // Required for Vercel and other reverse-proxy deployments
  trustHost: true,

  providers: [
    // Google OAuth — always enabled
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    /*
     * Resend magic-link provider — only included when RESEND_API_KEY is set.
     * Spread into the array so the provider is simply absent when not configured,
     * rather than causing a runtime error on missing env vars.
     */
    ...(process.env.RESEND_API_KEY
      ? [Resend({
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.FROM_EMAIL ?? "noreply@doughflow.app",
        })]
      : []),
    // Dev credentials — empty array in production (no-op)
    ...devProvider,
  ],

  // Custom page URLs
  pages: {
    signIn: "/login",              // Our custom login page
    verifyRequest: "/login?verify=1", // Shown after magic link is sent
  },

  callbacks: {
    /**
     * jwt callback — runs when a JWT is created or updated.
     * Copies user.id from the initial sign-in into the token so it persists
     * in subsequent requests without needing a DB lookup.
     */
    async jwt({ token, user }) {
      if (user) token.id = user.id; // user is only defined on initial sign-in
      return token;
    },

    /**
     * session callback — runs when session() or useSession() is called.
     * Copies the user ID from the token into session.user.id so it is
     * accessible throughout the app (e.g. in /api/tenant and tRPC context).
     */
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
