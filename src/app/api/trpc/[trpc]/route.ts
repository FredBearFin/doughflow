/**
 * tRPC HTTP handler — /api/trpc/[trpc]
 *
 * This file is the Next.js App Router entry point for all tRPC requests.
 * The `[trpc]` dynamic segment captures the procedure path
 * (e.g. "ingredient.getAll", "recipe.create") which is then routed by tRPC
 * to the correct procedure on the server.
 *
 * Both GET and POST methods are supported:
 *   - GET  — used for tRPC queries (data fetching)
 *   - POST — used for tRPC mutations (data modification)
 *   tRPC also uses POST for batch requests when multiple queries are
 *   combined by the httpBatchLink client configuration.
 *
 * The handler is created via `fetchRequestHandler` from @trpc/server, which
 * is the adapter for the Fetch API environment that Next.js App Router uses
 * (as opposed to Node.js http.IncomingMessage used in Pages Router).
 *
 * Configuration:
 *   - endpoint: must match the URL prefix the client is configured with
 *     (see src/components/providers.tsx → httpBatchLink → url)
 *   - router: the root appRouter that aggregates all sub-routers
 *   - createContext: builds the request context (session + prisma) injected
 *     into every procedure (see src/server/trpc.ts)
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

/**
 * Shared handler function used for both GET (queries) and POST (mutations).
 * fetchRequestHandler adapts the tRPC router to the Fetch API Request/Response
 * model used by the Next.js App Router edge and Node runtimes.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",     // Must match the client's httpBatchLink URL
    req,
    router: appRouter,         // The root tRPC router (all procedures)
    createContext: createTRPCContext, // Per-request context factory (session, prisma)
  });

// Export the same handler for both HTTP methods so tRPC can use either
export { handler as GET, handler as POST };
