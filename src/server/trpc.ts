/**
 * tRPC server initialisation and base procedures — src/server/trpc.ts
 *
 * This module bootstraps the tRPC server-side infrastructure:
 *   1. Defines the context factory (createTRPCContext) that runs on every request
 *   2. Initialises the tRPC instance with superjson serialisation
 *   3. Creates and exports the base procedure builders (router, publicProcedure,
 *      protectedProcedure)
 *
 * CONTEXT:
 *   The tRPC context is an object available in every procedure's handler via `ctx`.
 *   Our context contains:
 *     - session: the NextAuth session for the current request (null if unauthenticated)
 *     - prisma:  the shared Prisma client instance
 *
 *   createTRPCContext() is called by the HTTP handler in /api/trpc/[trpc]/route.ts
 *   on every inbound request. It calls NextAuth's `auth()` to resolve the session
 *   from the request's cookie without any arguments (App Router style).
 *
 * SUPERJSON TRANSFORMER:
 *   By default, tRPC only serialises plain JSON. superjson extends this to support
 *   richer JavaScript types: Date objects, Map, Set, BigInt, RegExp, undefined, etc.
 *   Without superjson, Date values returned from Prisma would be serialised as
 *   ISO strings and arrive on the client as strings rather than Date objects.
 *   With superjson, Dates round-trip correctly as Date instances.
 *
 *   Both the server (here) and the client (providers.tsx httpBatchLink) must use
 *   the same superjson transformer for correct serialisation/deserialisation.
 *
 * PROCEDURE TYPES:
 *
 *   publicProcedure   — No authentication required. Currently unused in the app
 *                       (reserved for future public endpoints like a status check).
 *
 *   protectedProcedure — Requires an active session (ctx.session?.user must exist).
 *                       Throws TRPCError UNAUTHORIZED if the user is not logged in.
 *                       Used by every procedure in all domain routers.
 *                       The middleware also forwards the session to `next()` so
 *                       downstream procedures can access it typed as non-null.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * createTRPCContext — Build the context object for each inbound tRPC request.
 *
 * Called automatically by fetchRequestHandler in the /api/trpc route.
 * auth() reads the NextAuth session from the request cookie using the
 * App Router's server-side session accessor (no Request argument needed).
 *
 * The returned object is available as `ctx` in every procedure handler.
 */
export async function createTRPCContext() {
  const session = await auth(); // Resolve NextAuth session from cookie
  return { session, prisma };  // Both are available in every procedure via ctx
}

/**
 * Context type — inferred from the createTRPCContext return value.
 * Used as the generic parameter for initTRPC so the type system knows what
 * properties are on `ctx` in procedure handlers.
 */
type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * tRPC instance — initialised with our Context type and superjson transformer.
 *
 * initTRPC.context<Context>() binds the context type to all procedures created
 * from this instance, ensuring full TypeScript autocomplete on ctx properties.
 *
 * transformer: superjson enables rich type serialisation for Dates, Maps, Sets,
 * and other non-JSON-native types across the client-server boundary.
 */
const t = initTRPC.context<Context>().create({ transformer: superjson });

/**
 * router — The tRPC router factory used to create domain routers.
 * Called in each router file (ingredient.ts, recipe.ts, etc.) and the root _app.ts.
 */
export const router = t.router;

/**
 * publicProcedure — A procedure that runs without any authentication check.
 * Currently not used in any router but exported for future use (e.g. health checks,
 * public product catalogue if the app gains a public-facing feature).
 */
export const publicProcedure = t.procedure;

/**
 * protectedProcedure — A procedure that requires the user to be authenticated.
 *
 * The middleware runs before the procedure handler and checks that
 * ctx.session.user exists. If not, it throws UNAUTHORIZED before the handler
 * is invoked — no procedure handler needs to repeat this check.
 *
 * Calling next({ ctx: { ...ctx, session: ctx.session } }) passes the narrowed
 * context to the handler, although TypeScript still sees session as potentially
 * null at this point. Downstream handlers rely on the middleware guarantee
 * rather than TypeScript narrowing.
 *
 * All domain routers use protectedProcedure for every procedure.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    // Reject the call immediately if there is no authenticated user
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
