/**
 * Prisma client singleton — src/lib/prisma.ts
 *
 * This module exports a single shared PrismaClient instance that is reused
 * across all server-side code in the application (tRPC routers, API routes,
 * auth callbacks, cron jobs, etc.).
 *
 * WHY A SINGLETON?
 *   PrismaClient opens a connection pool to the database. In a normal Node.js
 *   server, creating one client at startup and reusing it is fine.
 *
 *   However, Next.js in development mode uses hot module replacement (HMR):
 *   every time you save a file, the module cache is cleared and re-evaluated.
 *   Without the singleton pattern, each HMR cycle would create a new
 *   PrismaClient instance, each with its own connection pool. After enough
 *   reloads, you exhaust the database's connection limit and get errors.
 *
 * HOW THE SINGLETON WORKS:
 *   The `globalThis` object persists across HMR reloads because it lives
 *   outside the module cache. By storing the PrismaClient on `globalThis`,
 *   we ensure that subsequent module evaluations reuse the already-open client
 *   instead of creating a new one.
 *
 *   In production, modules are evaluated only once at startup, so the singleton
 *   guard is never triggered — but writing to globalThis in production is
 *   unnecessary, so the assignment is skipped with the NODE_ENV guard.
 *
 * LOGGING:
 *   In development, Prisma logs every SQL query, warning, and error to stdout.
 *   This makes it easy to see what queries are being generated and spot N+1
 *   problems during development. In production, only errors are logged to
 *   avoid polluting application logs with query noise.
 */

import { PrismaClient } from "@prisma/client";

/**
 * Extend the global object type to include our optional prisma property.
 * TypeScript's `globalThis` type does not include application-specific
 * properties, so we cast and augment the type here.
 *
 * The `prisma` property is `undefined` on first load (before assignment)
 * and a `PrismaClient` instance on subsequent HMR cycles.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The exported Prisma client instance.
 *
 * On first evaluation: `globalForPrisma.prisma` is undefined, so the nullish
 * coalescing operator creates a fresh PrismaClient.
 *
 * On subsequent HMR cycles in development: `globalForPrisma.prisma` is the
 * existing client, so it is reused without opening new connections.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Verbose logging in development; errors-only in production
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

/**
 * Store the client on globalThis in non-production environments so it
 * survives HMR reloads. Skipped in production where HMR doesn't occur.
 */
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
