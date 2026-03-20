/**
 * Dashboard layout — wraps every route inside the (dashboard) route group.
 *
 * Responsibilities:
 *   1. Authentication gate: reads the server-side session. If no authenticated
 *      user is found, the visitor is hard-redirected to /login before any
 *      dashboard HTML is rendered. This prevents flash-of-unauthenticated
 *      content and eliminates client-side redirect flicker.
 *   2. Shell layout: renders the fixed-width Sidebar on the left and a
 *      scrollable main content area on the right. Child pages ({children})
 *      are rendered inside the main area.
 *
 * This is a Server Component (no "use client" directive). The session check
 * runs on the server so authenticated state is known before the first byte
 * is sent to the browser.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * DashboardLayout is the shared shell for all dashboard pages.
 *
 * @param children - The active dashboard page rendered inside the main area.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // auth() reads the JWT session from cookies on the server.
  // If there is no valid session, redirect to the login page immediately.
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    // Full-height flex container; overflow-hidden prevents double scrollbars
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Fixed-width navigation sidebar shared across all dashboard pages */}
      <Sidebar />
      {/* Main content area scrolls independently of the sidebar */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
