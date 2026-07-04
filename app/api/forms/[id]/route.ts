import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";
import type { FormSchema } from "@/lib/form-engine/types";

async function assertTenantAccess(formId: string, session: { role: string; hospitalId: string | null }) {
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form || form.deletedAt) return { form: null, allowed: false };
  if (session.role === "SUPER_ADMIN") return { form, allowed: true };
  return { form, allowed: form.hospitalId === session.hospitalId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { form, allowed } = await assertTenantAccess(id, session);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });

  const versions = await prisma.formVersion.findMany({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json({ form, versions, latestSchema: versions[0]?.schema ?? null });
}

// PUT — saves a NEW immutable version. Never mutates a published version's schema in place.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.edit")) {
    return NextResponse.json({ error: "You don't have permission to edit forms." }, { status: 403 });
  }

  const { form, allowed } = await assertTenantAccess(id, session);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });

  const body = await req.json();
  const { schema, changelog, name, description } = body as {
    schema: FormSchema;
    changelog?: string;
    name?: string;
    description?: string;
  };

  const nextVersionNumber = form.currentVersion + 1;

  const [, version] = await prisma.$transaction([
    prisma.form.update({
      where: { id },
      data: {
        name: name ?? form.name,
        description: description ?? form.description,
        currentVersion: nextVersionNumber,
      },
    }),
    prisma.formVersion.create({
      data: {
        formId: id,
        versionNumber: nextVersionNumber,
        schema: schema as any,
        changelog,
        createdById: session.sub,
      },
    }),
  ]);

  await writeAuditLog({
    action: "form.updated",
    entityType: "form",
    entityId: id,
    userId: session.sub,
    hospitalId: form.hospitalId,
    metadata: { versionNumber: nextVersionNumber },
  });

  return NextResponse.json({ version });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.delete")) {
    return NextResponse.json({ error: "You don't have permission to delete forms." }, { status: 403 });
  }

  const { form, allowed } = await assertTenantAccess(id, session);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });

  await prisma.form.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog({ action: "form.deleted", entityType: "form", entityId: id, userId: session.sub, hospitalId: form.hospitalId });

  return NextResponse.json({ ok: true });
}
