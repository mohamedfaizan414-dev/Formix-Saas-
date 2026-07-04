import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Verify permission
  if (!roleHasPermission(session.role, "submission.edit")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sub = await prisma.submission.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Tenant isolation
  if (session.role !== "SUPER_ADMIN" && sub.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.submission.delete({ where: { id } });

  await writeAuditLog({
    action: "submission.updated", // or add "submission.deleted" to AuditAction type
    entityType: "submission",
    entityId: id,
    userId: session.sub,
    hospitalId: sub.hospitalId,
  });

  return NextResponse.json({ ok: true });
}