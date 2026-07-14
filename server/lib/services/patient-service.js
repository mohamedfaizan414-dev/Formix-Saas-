const { prisma } = require("../prisma");
const { sendFormAssignmentEmail } = require("../resend");

function isSuperAdmin(user) {
  return user.role === "SUPER_ADMIN";
}

function resolveWriteOrgId(user, requestedOrgId) {
  if (isSuperAdmin(user)) {
    if (!requestedOrgId) throw new Error("organizationId is required for SUPER_ADMIN actions.");
    return requestedOrgId;
  }
  if (!user.organizationId) throw new Error("Your account has no hospital assigned.");
  return user.organizationId;
}

class PatientService {
  static async getPatients(user) {
    return prisma.patient.findMany({
      where: isSuperAdmin(user) ? {} : { organizationId: user.organizationId || "__none__" },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          select: { id: true, status: true },
        },
      },
    });
  }

  static async createPatient(input, user) {
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

  static async getPatientDetails(patientId, user) {
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

  static async assignForm(patientId, formId, user) {
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

    const appUrl = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
    const fillLink = `${appUrl}/public-forms/${assignment.token}`;

    await sendFormAssignmentEmail({
      to: patient.email,
      patientName: [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "there",
      formTitle: form.name,
      formDescription: form.description || undefined,
      link: fillLink,
    });

    return assignment;
  }

  static async getAssignmentByToken(token) {
    return prisma.formAssignment.findUnique({
      where: { token },
      include: { patient: true, formVersion: true, form: true },
    });
  }

  static async recordSubmission(token, payload, isDraft) {
    const assignment = await prisma.formAssignment.findUnique({ where: { token } });
    if (!assignment) throw new Error("This form link is invalid or has expired.");
    if (assignment.status === "SUBMITTED") throw new Error("This form has already been submitted.");

    return prisma.formAssignment.update({
      where: { token },
      data: {
        payload: payload,
        ...(isDraft ? {} : { status: "SUBMITTED", submittedAt: new Date() }),
      },
    });
  }
}

module.exports = {
  PatientService,
};
