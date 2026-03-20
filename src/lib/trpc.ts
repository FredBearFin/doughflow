/**
 * tRPC React client factory — src/lib/trpc.ts
 *
 * This module creates and exports the typed tRPC React client (`trpc`) that is
 * used throughout all client components to call server-side procedures.
 *
 * HOW IT WORKS:
 *   `createTRPCReact<AppRouter>()` returns a typed proxy object where every
 *   key corresponds to a router namespace (ingredient, recipe, waste, etc.),
 *   and every nested key corresponds to a procedure (getAll, create, update…).
 *
 *   Calling `trpc.ingredient.getAll.useQuery({ tenantId })` in a component
 *   generates a fully typed React Query hook that:
 *     - Sends a GET request to /api/trpc/ingredient.getAll
 *     - Deserializes the response via superjson (handles Dates, Maps, etc.)
 *     - Returns typed `{ data, isLoading, error }` from React Query
 *
 *   Calling `trpc.ingredient.create.useMutation()` returns a typed mutation
 *   hook backed by React Query's useMutation.
 *
 * TYPE SAFETY:
 *   The generic parameter `<AppRouter>` (from src/server/routers/_app.ts) gives
 *   TypeScript full knowledge of every procedure's input and output types. Any
 *   mismatch between the call site and the procedure's Zod schema is a
 *   compile-time error — no runtime surprises from wrong payloads.
 *
 * PROVIDER SETUP:
 *   The `trpc` object exported here is only the procedure proxy. For it to work
 *   at runtime, the app must be wrapped in the <trpc.Provider> and
 *   <QueryClientProvider> components, which is done in src/components/providers.tsx.
 *
 * TRANSPORT:
 *   The httpBatchLink configured in providers.tsx batches multiple tRPC calls
 *   issued in the same React render cycle into a single HTTP request, reducing
 *   network round-trips when several hooks fire simultaneously (e.g. on a
 *   dashboard page that queries ingredients, recipes, and analytics at once).
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/**
 * The typed tRPC React client.
 *
 * Import this object in any Client Component to access procedure hooks:
 *   import { trpc } from "@/lib/trpc";
 *
 *   // In a component:
 *   const { data } = trpc.ingredient.getAll.useQuery({ tenantId });
 *   const mutation = trpc.ingredient.create.useMutation();
 */
export const trpc = createTRPCReact<AppRouter>();
