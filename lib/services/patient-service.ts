import { prisma } from "@/lib/prisma";
import type { RoleName } from "@prisma/client";
import { sendFormAssignmentEmail } from "@/lib/resend";

export interface UserContext {
  id: string;
  role: RoleName | string;
  organizationId: string | null;
}

export interface CreatePatientInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** Required only when the acting user is SUPER_ADMIN, who has no home hospital. */
  organizationId?: string;
}

function isSuperAdmin(user: UserContext) {
  return user.role === "SUPER_ADMIN";
}

/** Resolves which hospital a write should be scoped to, trusting the client
 * only for SUPER_ADMIN (who must explicitly pick one). Every other role is
 * force-scoped to their own session hospitalId — never trust a client-sent
 * organizationId for non-super-admins, or a receptionist at Hospital A could
 * create patients under Hospital B by editing a request payload. */
function resolveWriteOrgId(user: UserContext, requestedOrgId?: string): string {
  if (isSuperAdmin(user)) {
    if (!requestedOrgId) throw new Error("organizationId is required for SUPER_ADMIN actions.");
    return requestedOrgId;
  }
  if (!user.organizationId) throw new Error("Your account has no hospital assigned.");
  return user.organizationId;
}

export class PatientService {
  static async getPatients(user: UserContext) {
    return prisma.patient.findMany({
      where: isSuperAdmin(user) ? {} : { organizationId: user.organizationId ?? "__none__" },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          select: { id: true, status: true },
        },
      },
    });
  }

  static async createPatient(input: CreatePatientInput, user: UserContext) {
    const organizationId = resolveWriteOrgId(user, input.organizationId);

    const existing = await prisma.patient.findUnique({
      where: { organizationId_email: { organizationId, email: input.email } },
    });
    if (existing) throw new Error("A patient with this email already exists in this hospital.");

    return prisma.patient.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        organizationId,
      },
    });
  }

  static async getPatientDetails(patientId: string, user: UserContext) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        assignments: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!patient) throw new Error("Patient record not found.");
    if (!isSuperAdmin(user) && patient.organizationId !== user.organizationId) {
      throw new Error("You do not have access to this patient record.");
    }

    return patient;
  }

  /**
   * Sends a form to a patient: locks in the currently published form
   * version, writes the assignment ledger row, and emails the patient a
   * secure, tokenized link. Throws if the form has no published version —
   * you cannot send a draft.
   */
  static async assignForm(patientId: string, formId: string, user: UserContext) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error("Patient record not found.");
    if (!isSuperAdmin(user) && patient.organizationId !== user.organizationId) {
      throw new Error("You do not have access to this patient record.");
    }

    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new Error("Form not found.");
    if (!isSuperAdmin(user) && form.hospitalId !== patient.organizationId) {
      throw new Error("This form does not belong to the patient's hospital.");
    }

    const publishedVersion = await prisma.formVersion.findFirst({
      where: { formId, isPublished: true },
      orderBy: { versionNumber: "desc" },
    });
    if (!publishedVersion) throw new Error("This form has no published version yet.");

    const assignment = await prisma.formAssignment.create({
      data: {
        patientId,
        formId,
        formVersionId: publishedVersion.id,
        formTitle: form.name,
        assignedById: user.id,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const fillLink = `${appUrl}/public-forms/${assignment.token}`;

    await sendFormAssignmentEmail({
      to: patient.email,
      patientName: [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "there",
      formTitle: form.name,
      formDescription: form.description ?? undefined,
      link: fillLink,
    });

    return assignment;
  }

  /** Used by the public, unauthenticated form-fill route. No user context —
   * access is gated entirely by possession of the token. */
  static async getAssignmentByToken(token: string) {
    return prisma.formAssignment.findUnique({
      where: { token },
      include: { patient: true, formVersion: true, form: true },
    });
  }

  static async recordSubmission(token: string, payload: Record<string, unknown>, isDraft: boolean) {
    const assignment = await prisma.formAssignment.findUnique({ where: { token } });
    if (!assignment) throw new Error("This form link is invalid or has expired.");
    if (assignment.status === "SUBMITTED") throw new Error("This form has already been submitted.");

    return prisma.formAssignment.update({
      where: { token },
      data: {
        payload: payload as any,
        ...(isDraft ? {} : { status: "SUBMITTED", submittedAt: new Date() }),
      },
    });
  }
}