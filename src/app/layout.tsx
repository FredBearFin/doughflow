/**
 * Root layout — wraps every page in the application.
 *
 * This is the outermost layout in the Next.js App Router hierarchy. It is
 * rendered for every route and provides:
 *   1. The HTML document skeleton (<html>, <body>)
 *   2. The DM Sans font loaded via next/font/google and applied as a CSS
 *      variable (--font-dm-sans). The `antialiased` Tailwind utility smooths
 *      font rendering on macOS and certain LCD screens.
 *   3. The <Providers> wrapper which sets up:
 *        - NextAuth's SessionProvider (makes useSession available)
 *        - React Query's QueryClientProvider
 *        - tRPC's Provider
 *   4. SEO metadata (title and description) exported as a Next.js Metadata
 *      object so the framework can inject appropriate <head> tags.
 *
 * This file is a Server Component (no "use client") — font loading and
 * metadata are server-side concerns. The Providers component is a Client
 * Component that wraps children client-side.
 */

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/**
 * DM Sans font configuration.
 * - subsets: only load the "latin" character subset to reduce font file size
 * - variable: exposes the font as a CSS custom property so Tailwind's
 *   font-sans utility can reference it (configured in tailwind.config.ts)
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

/**
 * Page metadata applied to every route unless a nested layout or page
 * overrides it. Rendered as <title> and <meta name="description">.
 */
export const metadata: Metadata = {
  title: "DoughFlow — Lean Inventory for Bakeries",
  description: "The mathematical brain for bakery back-of-house operations.",
};

/**
 * RootLayout wraps the entire application.
 *
 * @param children - The active page or nested layout rendered inside the body.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
       * Apply the DM Sans CSS variable and antialiasing to the body.
       * The font variable is referenced by Tailwind's `font-sans` class.
       */}
      <body className={`${dmSans.variable} antialiased`}>
        {/* Providers wraps all client-side context (session, React Query, tRPC) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
