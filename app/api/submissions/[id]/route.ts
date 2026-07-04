import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { formVersion: true, form: true },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && submission.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ submission });
}

// PUT — amends a submission, keeping the prior state in submission_versions (audit trail)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "submission.edit")) {
    return NextResponse.json({ error: "You don't have permission to edit submissions." }, { status: 403 });
  }

  const existing = await prisma.submission.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && existing.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data, submit } = await req.json();

  const [, updated] = await prisma.$transaction([
    prisma.submissionVersion.create({
      data: { submissionId: id, data: existing.data as any, editedById: session.sub },
    }),
    prisma.submission.update({
      where: { id },
      data: {
        data,
        status: submit ? "SUBMITTED" : existing.status === "SUBMITTED" ? "AMENDED" : "DRAFT",
        submittedAt: submit ? new Date() : existing.submittedAt,
      },
    }),
  ]);

  await writeAuditLog({
    action: "submission.updated",
    entityType: "submission",
    entityId: id,
    userId: session.sub,
    hospitalId: existing.hospitalId,
  });

  return NextResponse.json({ submission: updated });
}
