/**
 * useTenantId — Client-side tenant resolution hook — src/lib/useTenant.ts
 *
 * This hook resolves the current user's tenantId on the client side. In
 * DoughFlow's multi-tenant architecture, every data query is scoped to a
 * tenantId (a bakery's unique identifier). Client components need the tenantId
 * to pass it to tRPC procedures (e.g. `trpc.ingredient.getAll.useQuery({ tenantId })`).
 *
 * HOW TENANT RESOLUTION WORKS:
 *   1. The user's NextAuth session contains their userId (injected by the jwt
 *      callback in src/lib/auth.ts).
 *   2. The /api/tenant route looks up the TenantUser row for that userId and
 *      returns the associated tenantId.
 *   3. This hook calls that API route once, then caches the result in a
 *      module-level variable so subsequent calls are instant (no re-fetch).
 *
 * MODULE-LEVEL CACHE:
 *   `cachedTenantId` is declared outside the hook so it persists across
 *   component re-renders and re-mounts within the same browser session.
 *   The cache is never invalidated — tenantId is immutable for a logged-in user.
 *
 *   Note: This is a simple in-memory cache. In production at scale, a proper
 *   React context or server component prop-passing would be more idiomatic
 *   (see the comment in the source), but the current approach is sufficient
 *   for a single-tab SPA where tenantId never changes without a full reload.
 *
 * FETCH TRIGGER:
 *   The useEffect depends on `session?.user?.id`. The fetch only runs when:
 *     a) The session is loaded (session.user.id is available)
 *     b) The cache is empty (cachedTenantId is null)
 *   This prevents duplicate fetches on re-renders and before the session loads.
 *
 * ERROR HANDLING:
 *   Fetch errors are silently swallowed (`.catch(() => null)`). If the tenant
 *   API fails, `tenantId` remains null and tRPC queries will not fire (they
 *   use `enabled: !!tenantId` guards in the calling components).
 *
 * This is a Client Component hook ("use client") because it uses browser APIs
 * (fetch), React state, and the NextAuth useSession hook.
 */

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Module-level cache for the resolved tenantId.
 * Persists across re-renders for the lifetime of the browser session.
 * Initialized to null; set once after the first successful /api/tenant fetch.
 *
 * In production a proper context or server-side solution is preferable,
 * but this simple cache avoids redundant API calls without additional complexity.
 */
// Simple client-side tenant cache
// In production: use a proper context or server component
let cachedTenantId: string | null = null;

/**
 * useTenantId — Returns the current user's tenantId, or null while loading.
 *
 * Usage in a component:
 *   const tenantId = useTenantId();
 *   const { data } = trpc.ingredient.getAll.useQuery(
 *     { tenantId: tenantId! },
 *     { enabled: !!tenantId }   // don't fire until tenantId is known
 *   );
 *
 * The hook initialises from the module-level cache so re-mounts and sibling
 * components that call this hook will all receive the cached value immediately
 * without waiting for a new fetch.
 *
 * @returns The tenantId string once resolved, or null if still loading/errored
 */
export function useTenantId(): string | null {
  const { data: session } = useSession();
  // Initialise from cache so subsequent hook consumers get the value immediately
  const [tenantId, setTenantId] = useState<string | null>(cachedTenantId);

  useEffect(() => {
    // Skip fetch if we already have a cached value
    if (cachedTenantId) return;
    // Skip fetch if the session hasn't loaded yet (user.id is undefined)
    if (!session?.user?.id) return;

    // Fetch the tenant ID from the API route, which looks up the TenantUser join
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenantId) {
          // Write to both the module cache and local state
          cachedTenantId = data.tenantId;
          setTenantId(data.tenantId);
        }
      })
      .catch(() => null); // Silently handle errors; queries stay disabled until resolved
  }, [session?.user?.id]); // Re-run only when the user's identity changes

  return tenantId;
}
