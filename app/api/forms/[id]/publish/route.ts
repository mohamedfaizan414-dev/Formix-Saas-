import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.publish")) {
    return NextResponse.json({ error: "You don't have permission to publish forms." }, { status: 403 });
  }

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form || form.deletedAt) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });
  }

  const { publish } = await req.json().catch(() => ({ publish: true }));

  const latestVersion = await prisma.formVersion.findFirst({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
  });
  if (!latestVersion) return NextResponse.json({ error: "No version to publish." }, { status: 400 });

  await prisma.$transaction([
    prisma.form.update({ where: { id }, data: { status: publish ? "PUBLISHED" : "DRAFT" } }),
    prisma.formVersion.update({
      where: { id: latestVersion.id },
      data: { isPublished: publish, publishedAt: publish ? new Date() : null },
    }),
  ]);

  await writeAuditLog({
    action: publish ? "form.published" : "form.unpublished",
    entityType: "form",
    entityId: id,
    userId: session.sub,
    hospitalId: form.hospitalId,
  });

  return NextResponse.json({ ok: true });
}
