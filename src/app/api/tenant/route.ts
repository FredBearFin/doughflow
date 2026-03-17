import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: session.user.id },
    include: { tenant: true },
  });

  if (!tenantUser) {
    return NextResponse.json({ tenantId: null });
  }

  return NextResponse.json({ tenantId: tenantUser.tenantId, tenant: tenantUser.tenant });
}
