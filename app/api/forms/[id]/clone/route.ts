import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.clone")) {
    return NextResponse.json({ error: "You don't have permission to clone forms." }, { status: 403 });
  }

  const source = await prisma.form.findUnique({ where: { id } });
  if (!source || source.deletedAt) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && source.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });
  }

  const latest = await prisma.formVersion.findFirst({ where: { formId: id }, orderBy: { versionNumber: "desc" } });

  const clone = await prisma.form.create({
    data: {
      hospitalId: source.hospitalId,
      departmentId: source.departmentId,
      name: `${source.name} (Copy)`,
      slug: `${source.slug}-copy-${nanoid(5)}`,
      description: source.description,
      category: source.category,
      status: "DRAFT",
      createdById: session.sub,
      versions: {
        create: { versionNumber: 1, schema: (latest?.schema ?? {}) as any, createdById: session.sub },
      },
    },
  });

  await writeAuditLog({ action: "form.cloned", entityType: "form", entityId: clone.id, userId: session.sub, hospitalId: source.hospitalId, metadata: { sourceFormId: id } });

  return NextResponse.json({ form: clone });
}
