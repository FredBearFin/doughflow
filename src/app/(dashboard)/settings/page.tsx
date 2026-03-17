"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Users } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" />

      <div className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Bakery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bakery Name</Label>
              <Input placeholder="Your bakery name" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-500 mb-3">
              Manage your supplier directory for automated purchase orders.
            </p>
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
