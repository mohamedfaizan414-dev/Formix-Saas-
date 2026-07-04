import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";
import type { FormSchema } from "@/lib/form-engine/types";

// GET /api/forms — list forms for the caller's hospital (Super Admin sees all)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = { deletedAt: null };
  if (session.role !== "SUPER_ADMIN") {
    if (!session.hospitalId) return NextResponse.json({ forms: [] });
    where.hospitalId = session.hospitalId;
  }
  if (status) where.status = status;

  const forms = await prisma.form.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { hospital: { select: { name: true } }, createdBy: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({ forms });
}

// POST /api/forms — create a new form (draft) with an initial version
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.create")) {
    return NextResponse.json({ error: "You don't have permission to create forms." }, { status: 403 });
  }
  if (!session.hospitalId && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No hospital assigned to your account." }, { status: 400 });
  }

  const body = await req.json();
  const { name, description, category, hospitalId: hospitalIdInput, departmentId, schema: initialSchema } = body as {
    name: string;
    description?: string;
    category?: string;
    hospitalId?: string;
    departmentId?: string;
    schema?: FormSchema;
  };

  if (!name?.trim()) return NextResponse.json({ error: "Form name is required." }, { status: 400 });

  const hospitalId = session.role === "SUPER_ADMIN" ? hospitalIdInput : session.hospitalId!;
  if (!hospitalId) return NextResponse.json({ error: "hospitalId is required." }, { status: 400 });

  const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(5)}`;

  const schema: FormSchema = initialSchema ?? {
    title: name,
    description,
    layout: "single",
    sections: [{ id: nanoid(10), title: "Section 1", components: [] }],
    conditionalRules: [],
  };

  const form = await prisma.form.create({
    data: {
      hospitalId,
      departmentId,
      name,
      slug,
      description,
      category,
      status: "DRAFT",
      createdById: session.sub,
      versions: {
        create: {
          versionNumber: 1,
          schema: schema as any,
          createdById: session.sub,
        },
      },
    },
    include: { versions: true },
  });

  await writeAuditLog({
    action: "form.created",
    entityType: "form",
    entityId: form.id,
    userId: session.sub,
    hospitalId,
  });

  return NextResponse.json({ form });
}
