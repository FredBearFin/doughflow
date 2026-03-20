/**
 * Tenant resolution API route — GET /api/tenant
 *
 * Returns the tenantId associated with the currently authenticated user.
 * Called once by the `useTenantId` hook after sign-in; result is cached
 * client-side for the lifetime of the browser session.
 *
 * AUTO-PROVISIONING:
 *   If the authenticated user has no tenant yet (first sign-in via Google),
 *   this route automatically creates one for them. The bakery name defaults
 *   to "[Name]'s Bakery" and can be changed later in /settings.
 *   This means every user who signs in always gets a working tenant —
 *   no manual seeding or admin step required.
 *
 * Response:
 *   - 401 { error: "Unauthorized" }  — no valid session
 *   - 200 { tenantId: string, tenant: Tenant }  — always returned for auth'd users
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if this user already has a tenant
  const existing = await prisma.tenantUser.findFirst({
    where:   { userId: session.user.id },
    include: { tenant: true },
  });

  if (existing) {
    return NextResponse.json({ tenantId: existing.tenantId, tenant: existing.tenant });
  }

  // ── First sign-in: auto-provision a tenant ────────────────────────────────
  // Generate a URL-safe slug from the user's name + a random suffix so it's unique.
  const rawName  = session.user.name ?? session.user.email ?? "My Bakery";
  const baseName = rawName.split("@")[0]; // drop email domain if that's all we have
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")      // trim leading/trailing hyphens
    .slice(0, 30);                 // keep it short
  const suffix = Math.random().toString(36).slice(2, 6); // 4-char random suffix
  const slug   = `${baseSlug || "bakery"}-${suffix}`;

  const tenant = await prisma.tenant.create({
    data: {
      name:  `${baseName}'s Bakery`,
      slug,
      plan:  "TRIAL",
      users: {
        create: {
          userId: session.user.id,
          role:   "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ tenantId: tenant.id, tenant });
}
