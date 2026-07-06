// app/api/submissions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

const ANONYMOUS_SYSTEM_USER_ID = "anonymous-public-user";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { formVersion: true, form: true },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!session) {
    const isResumableAnonymousDraft = !submission.submittedById && submission.form.status === "PUBLISHED";
    if (!isResumableAnonymousDraft) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ submission });
  }

  if (session.role !== "SUPER_ADMIN" && submission.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ submission });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const existing = await prisma.submission.findUnique({ where: { id }, include: { form: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAnonymousDraftOwner = !session && !existing.submittedById && existing.form.status === "PUBLISHED";

  if (session) {
    if (!roleHasPermission(session.role, "submission.edit")) {
      return NextResponse.json({ error: "You don't have permission to edit submissions." }, { status: 403 });
    }
    if (session.role !== "SUPER_ADMIN" && existing.hospitalId !== session.hospitalId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } else if (!isAnonymousDraftOwner) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, submit } = await req.json();

  // 🌟 FIXED: Flattened parameters to directly update fields by string identifier values
  const [, updated] = await prisma.$transaction([
    prisma.submissionVersion.create({
      data: {
        submissionId: id,
        data: existing.data as any,
        editedById: session ? session.sub : ANONYMOUS_SYSTEM_USER_ID,
      },
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
    userId: session ? session.sub : "anonymous_public_client",
    hospitalId: existing.hospitalId,
  });

  return NextResponse.json({ submission: updated });
}