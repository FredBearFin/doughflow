/**
 * Providers — application-wide React context wrapper.
 *
 * This component is rendered once at the root layout level and provides the
 * necessary context providers for the entire application:
 *
 *   1. SessionProvider (NextAuth) — makes `useSession` available throughout
 *      the component tree. The session is read by TopBar (for the user avatar),
 *      Sidebar (for sign-out), and useTenantId (for the tenant API call).
 *
 *   2. trpc.Provider — the tRPC React Query integration layer. Links the tRPC
 *      client (configured below) to the React Query client so that tRPC
 *      procedures can be called as React Query hooks.
 *
 *   3. QueryClientProvider (React Query) — provides the shared query cache to
 *      all tRPC hooks. The QueryClient is created inside a useState so it is
 *      stable across re-renders but a fresh instance is created per component
 *      mount (important for server-side rendering correctness).
 *
 * tRPC client configuration:
 *   - Uses httpBatchLink which batches multiple queries fired in the same
 *     render cycle into a single HTTP request (improves performance).
 *   - Uses superjson as the transformer so Date objects, Maps, Sets, and
 *     BigInts survive the JSON serialisation/deserialisation round-trip.
 *   - The base URL is resolved by getBaseUrl() which handles three environments:
 *       browser → relative path "" (same-origin)
 *       Vercel  → VERCEL_URL env var (the deployment's canonical URL)
 *       local   → localhost with PORT or 3000
 *
 * This is a Client Component ("use client") because all three providers
 * require a browser environment and React context.
 */

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { SessionProvider } from "next-auth/react";

/**
 * Resolves the base URL for tRPC HTTP requests.
 *
 * - In the browser: returns "" so requests use the same origin (relative URLs)
 * - On Vercel: returns the full https:// URL from the VERCEL_URL env variable
 * - Locally: falls back to http://localhost:<PORT> (PORT defaults to 3000)
 *
 * This is needed because tRPC client requests originate from both the browser
 * (relative URLs work fine) and the server (absolute URLs required for SSR).
 */
function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Browser — use relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel deployment
  return `http://localhost:${process.env.PORT ?? 3000}`; // Local development
}

/**
 * Providers wraps the entire application with all required React contexts.
 *
 * @param children - The application tree to wrap
 */
export function Providers({ children }: { children: React.ReactNode }) {
  /**
   * Stable QueryClient instance. Created inside useState to ensure a new
   * instance is created per component mount (required for correct SSR
   * behaviour and test isolation).
   */
  const [queryClient] = useState(() => new QueryClient());

  /**
   * tRPC client instance. Also created inside useState for stability.
   * httpBatchLink batches concurrent queries into a single HTTP request,
   * reducing round-trips when multiple tRPC hooks fire simultaneously.
   * superjson handles Date serialisation across the wire.
   */
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    // SessionProvider must wrap everything so useSession works anywhere
    <SessionProvider>
      {/* trpc.Provider links the tRPC client to the React Query client */}
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {/* QueryClientProvider exposes the query cache to all React Query hooks */}
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
