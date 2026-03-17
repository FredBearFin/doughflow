"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Simple client-side tenant cache
// In production: use a proper context or server component
let cachedTenantId: string | null = null;

export function useTenantId(): string | null {
  const { data: session } = useSession();
  const [tenantId, setTenantId] = useState<string | null>(cachedTenantId);

  useEffect(() => {
    if (cachedTenantId) return;
    if (!session?.user?.id) return;

    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenantId) {
          cachedTenantId = data.tenantId;
          setTenantId(data.tenantId);
        }
      })
      .catch(() => null);
  }, [session?.user?.id]);

  return tenantId;
}
