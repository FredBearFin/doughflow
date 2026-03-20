/**
 * Settings page — /settings
 *
 * A top-level settings hub for the bakery tenant. Currently provides two
 * sections:
 *
 *   1. Bakery Info — a stub form for editing the bakery name. This section
 *      is intentionally lightweight for now; backend persistence of the name
 *      can be wired up when the tenant management feature is built out.
 *
 *   2. Suppliers — a link card that navigates to /settings/suppliers, where
 *      staff can manage the supplier directory used for purchase orders.
 *
 * The page is a Client Component ("use client") because it imports TopBar,
 * which reads session data client-side. The form inputs are uncontrolled at
 * this stage (no onSubmit handler wired to a mutation yet).
 */

"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Users } from "lucide-react";

/**
 * SettingsPage is the default export for the /settings route.
 * It renders the settings hub with bakery info and supplier management sections.
 */
export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" />

      {/* max-w-2xl constrains the form width for comfortable reading on large screens */}
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Bakery info section — stub for updating the bakery name */}
        <Card>
          <CardHeader>
            <CardTitle>Bakery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bakery Name</Label>
              {/* Uncontrolled placeholder — persistence not yet implemented */}
              <Input placeholder="Your bakery name" />
            </div>
            {/* Save button exists in the UI; the mutation handler is pending implementation */}
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Supplier management — navigates to the suppliers sub-page */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-500 mb-3">
              Manage your supplier directory for automated purchase orders.
            </p>
            {/* Link wraps the Button so the whole button is a navigable element */}
            <Link href="/settings/suppliers">
              <Button variant="outline">
                <Users className="h-4 w-4" />
                Manage Suppliers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
