import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "auditLog.view") && !roleHasPermission(session.role, "submission.viewOwnHospital")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const where: Record<string, unknown> = {};
  if (session.role !== "SUPER_ADMIN") where.hospitalId = session.hospitalId;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({ logs });
}
