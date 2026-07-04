import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

// GET /api/submissions?formId=... — hospital-scoped submission list
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const formId = req.nextUrl.searchParams.get("formId") ?? undefined;
  const where: Record<string, unknown> = {};
  if (session.role !== "SUPER_ADMIN") {
    if (!session.hospitalId) return NextResponse.json({ submissions: [] });
    where.hospitalId = session.hospitalId;
  }
  if (formId) where.formId = formId;

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { submittedBy: { select: { firstName: true, lastName: true } }, form: { select: { name: true } } },
    take: 200,
  });

  return NextResponse.json({ submissions });
}

// POST /api/submissions — create a draft or submitted response against a specific form version
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "submission.create")) {
    return NextResponse.json({ error: "You don't have permission to submit forms." }, { status: 403 });
  }

  const body = await req.json();
  const { formId, formVersionId, data, patientId, encounterId, submit } = body as {
    formId: string;
    formVersionId: string;
    data: Record<string, unknown>;
    patientId?: string;
    encounterId?: string;
    submit?: boolean;
  };

  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });
  }

  const submission = await prisma.submission.create({
    data: {
      formId,
      formVersionId,
      hospitalId: form.hospitalId,
      patientId,
      encounterId,
      status: submit ? "SUBMITTED" : "DRAFT",
      data: data as any,
      submittedById: session.sub,
      submittedAt: submit ? new Date() : null,
    },
  });

  await writeAuditLog({
    action: "submission.created",
    entityType: "submission",
    entityId: submission.id,
    userId: session.sub,
    hospitalId: form.hospitalId,
    metadata: { formId, status: submission.status },
  });

  return NextResponse.json({ submission });
}
