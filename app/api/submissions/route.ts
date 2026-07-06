// app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { writeAuditLog } from "@/lib/audit/log";

// Placeholder user id used only as a valid FK anchor for submittedById when 
// the submitter is an anonymous public user.
const ANONYMOUS_SYSTEM_USER_ID = "anonymous-public-user";

// GET /api/submissions?formId=... — hospital-scoped submission list (UNTOUCHED)
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

// POST /api/submissions — create a draft or public/user response against a specific form version
export async function POST(req: NextRequest) {
  const session = await getSession();

  const body = await req.json();
  const { formId, formVersionId, data, patientId, encounterId, submit, isPublic } = body as {
    formId: string;
    formVersionId: string;
    data: Record<string, unknown>;
    patientId?: string;
    encounterId?: string;
    submit?: boolean;
    isPublic?: boolean; 
  };

  // Fetch form details FIRST to verify tenant domain context and publication status
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  // 🌟 CRITICAL FIX: If the payload is explicitly flagged as a public form transaction,
  // we treat it as an anonymous link response and bypass staff session cookie validations.
  const processAsPublicForm = isPublic === true || !session;

  if (processAsPublicForm) {
    if (form.status !== "PUBLISHED") {
      return NextResponse.json({ error: "This form is not accepting public link submissions." }, { status: 403 });
    }
  } else {
    // Protected Internal Enterprise App Session Routines
    if (session) {
      if (!roleHasPermission(session.role, "submission.create")) {
        return NextResponse.json({ error: "You don't have permission to submit forms." }, { status: 403 });
      }
      if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) {
        return NextResponse.json({ error: "Not authorized for this hospital's data." }, { status: 403 });
      }
    }
  }

  // Clear Prisma JSON typing boundaries completely
  const sanitizedJsonPayload = JSON.parse(JSON.stringify(data ?? {}));

  // SHIELD PROTECTION CHECK: If formVersionId is empty or undefined, 
  // find the latest version profile for this form to prevent a database constraint violation
  let activeVersionUuid = formVersionId;
  if (!activeVersionUuid || activeVersionUuid === "null" || activeVersionUuid === "") {
    const fallbackVersion = await prisma.formVersion.findFirst({
      where: { formId: formId },
      orderBy: { versionNumber: "desc" },
      select: { id: true }
    });
    activeVersionUuid = fallbackVersion?.id || "";
  }

  try {
    const submission = await prisma.submission.create({
      data: {
        formId: formId,
        formVersionId: activeVersionUuid,
        hospitalId: form.hospitalId,
        patientId: patientId || null,
        encounterId: encounterId || null,
        status: submit ? "SUBMITTED" : "DRAFT",
        data: sanitizedJsonPayload,
        // Link system account ONLY if processed internally for authenticated staff members
        submittedById: (!processAsPublicForm && session) ? session.sub : ANONYMOUS_SYSTEM_USER_ID,
        submittedAt: submit ? new Date() : null,
      },
    });

    await writeAuditLog({
      action: "submission.created",
      entityType: "submission",
      entityId: submission.id,
      userId: (!processAsPublicForm && session) ? session.sub : null, 
      hospitalId: form.hospitalId,
      metadata: { 
        formId, 
        status: submission.status, 
        isPublicLinkSubmission: processAsPublicForm,
        submitterLabel: processAsPublicForm ? "anonymous_public_client" : `User #${session?.sub}`
      },
    });

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error("Prisma critical error at root ingestion write path:", error);
    return NextResponse.json({ error: "Internal write validation anomaly." }, { status: 500 });
  }
}