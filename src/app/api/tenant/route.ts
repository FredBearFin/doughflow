/**
 * Tenant resolution API route — GET /api/tenant
 *
 * Returns the tenantId (and tenant record) associated with the currently
 * authenticated user. This route exists because DoughFlow is a multi-tenant
 * SaaS — each user belongs to exactly one tenant (bakery), and all tRPC
 * queries are scoped to a tenantId for data isolation.
 *
 * The client-side `useTenantId` hook calls this endpoint once after the user
 * signs in, caches the result in a module-level variable, and makes it
 * available throughout the React component tree.
 *
 * Response:
 *   - 401 { error: "Unauthorized" }   if no valid session exists
 *   - 200 { tenantId: null }           if the user has no tenant association
 *     (e.g. a new user who hasn't been onboarded yet)
 *   - 200 { tenantId: string, tenant: Tenant }  normal case
 *
 * Security note: because this route reads from the server session (JWT cookie),
 * it cannot be spoofed by a client passing a fake userId. Tenant scoping for
 * all data queries is handled at the tRPC procedure level using the same session.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET handler — resolves the tenant for the currently authenticated user.
 * No request body or query parameters are required; the user is identified
 * solely from the session cookie.
 */
export async function GET() {
  // Read the server-side session (JWT strategy — no DB lookup needed for the session)
  const session = await auth();

  // Reject unauthenticated requests immediately
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /**
   * Look up the TenantUser join record for this user.
   * TenantUser is the many-to-many join between User and Tenant.
   * findFirst is safe here because each user belongs to at most one tenant
   * in the current data model.
   */
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: session.user.id },
    include: { tenant: true }, // Include the full tenant record for display purposes
  });

  // User exists but has not been assigned to a tenant yet
  if (!tenantUser) {
    return NextResponse.json({ tenantId: null });
  }

  // Return the tenantId and tenant details for the client to cache
  return NextResponse.json({ tenantId: tenantUser.tenantId, tenant: tenantUser.tenant });
}
