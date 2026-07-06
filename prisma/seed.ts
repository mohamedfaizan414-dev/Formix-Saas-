// prisma/seed.ts
import { PrismaClient, RoleName } from "@prisma/client";
import { hashPassword } from "../lib/auth/jwt";
import { nanoid } from "nanoid";
import type { FormSchema } from "../lib/form-engine/types";

const prisma = new PrismaClient();

const PERMISSION_KEYS = [
  "form.create", "form.edit", "form.delete", "form.publish", "form.archive", "form.clone",
  "form.importExport", "template.manage", "hospital.manage", "user.manage", "permission.manage",
  "auditLog.view", "analytics.view", "submission.view", "submission.viewOwnHospital",
  "submission.create", "submission.edit", "version.manage", "form.assignToHospital", "hospital.toggleActive",
];

async function main() {
  console.log("Seeding permissions & roles…");
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, label: key } });
  }

  const roleNames: RoleName[] = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"];
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("Seeding demo hospital…");
  const hospital = await prisma.hospital.upsert({
    where: { slug: "sunrise-general" },
    update: {},
    create: { name: "Sunrise General Hospital", slug: "sunrise-general", isActive: true, address: "12 Chart Lane" },
  });

  const opd = await prisma.department.upsert({
    where: { hospitalId_name: { hospitalId: hospital.id, name: "OPD" } },
    update: {},
    create: { hospitalId: hospital.id, name: "OPD" },
  });

  console.log("Seeding demo users (password: Passw0rd!)…");
  const passwordHash = await hashPassword("Passw0rd!");
  const roles = await prisma.role.findMany();
  const roleId = (name: RoleName) => roles.find((r) => r.name === name)!.id;

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@formix.dev" },
    update: {},
    create: { email: "super@formix.dev", firstName: "Alex", lastName: "Reyes", passwordHash, roleId: roleId("SUPER_ADMIN") },
  });

  const hospitalAdmin = await prisma.user.upsert({
    where: { email: "admin@sunrise.dev" },
    update: {},
    create: { email: "admin@sunrise.dev", firstName: "Priya", lastName: "Nair", passwordHash, roleId: roleId("HOSPITAL_ADMIN"), hospitalId: hospital.id },
  });

  await prisma.user.upsert({
    where: { email: "doctor@sunrise.dev" },
    update: {},
    create: { email: "doctor@sunrise.dev", firstName: "Rahul", lastName: "Menon", passwordHash, roleId: roleId("DOCTOR"), hospitalId: hospital.id, departmentId: opd.id },
  });

  await prisma.user.upsert({
    where: { email: "nurse@sunrise.dev" },
    update: {},
    create: { email: "nurse@sunrise.dev", firstName: "Leah", lastName: "Thomas", passwordHash, roleId: roleId("NURSE"), hospitalId: hospital.id, departmentId: opd.id },
  });

  await prisma.user.upsert({
    where: { email: "reception@sunrise.dev" },
    update: {},
    create: { email: "reception@sunrise.dev", firstName: "Sam", lastName: "George", passwordHash, roleId: roleId("RECEPTIONIST"), hospitalId: hospital.id, departmentId: opd.id },
  });

  console.log("Seeding a sample published OPD assessment form…");
  const schema: FormSchema = {
    title: "OPD Assessment Form",
    description: "Standard outpatient assessment with conditional pregnancy section.",
    layout: "single",
    sections: [
      {
        id: nanoid(10),
        title: "Patient & Vitals",
        components: [
          { id: "gender_field", type: "dropdown", label: "Gender", internalName: "gender", options: [{ label: "Female", value: "female" }, { label: "Male", value: "male" }, { label: "Other", value: "other" }], validation: { required: true }, display: { width: "half" } },
          { id: "age_field", type: "number", label: "Age", internalName: "age", validation: { required: true, min: 0, max: 120 }, display: { width: "half" } },
          { id: "vitals_field", type: "vitals", label: "Vitals", internalName: "vitals", validation: {}, display: { width: "full" } },
          { id: "pregnancy_field", type: "text", label: "Weeks pregnant", internalName: "pregnancy_weeks", validation: { hidden: true }, display: { width: "half" } },
          { id: "allergies_field", type: "allergies", label: "Allergies", internalName: "allergies", validation: {}, display: { width: "full" } },
          { id: "consent_field", type: "consent", label: "Consent", internalName: "consent", description: "I consent to this assessment and treatment plan.", validation: { required: true }, display: { width: "full" } },
          { id: "signature_field", type: "patientSignature", label: "Patient Signature", internalName: "patient_signature", validation: { required: true }, display: { width: "full" } },
        ],
      },
    ],
    conditionalRules: [
      {
        id: nanoid(8),
        name: "Show pregnancy field for female patients",
        when: { id: nanoid(8), combinator: "AND", rules: [{ id: nanoid(8), field: "gender", operator: "equals", value: "female" }] },
        action: "show",
        targetFieldIds: ["pregnancy_field"],
      },
    ],
  };

  const form = await prisma.form.upsert({
    where: { hospitalId_slug: { hospitalId: hospital.id, slug: "opd-assessment-form" } },
    update: {},
    create: {
      hospitalId: hospital.id,
      departmentId: opd.id,
      name: "OPD Assessment Form",
      slug: "opd-assessment-form",
      description: schema.description,
      category: "Clinical",
      status: "PUBLISHED",
      currentVersion: 1,
      createdById: hospitalAdmin.id,
      versions: {
        create: { versionNumber: 1, schema: schema as any, isPublished: true, publishedAt: new Date(), createdById: hospitalAdmin.id },
      },
    },
  });

  // 🌟 ESSENTIAL ADDITION: Seed the anonymous public link user anchor safely here
  console.log("Seeding anonymous public form user account…");
  await prisma.user.upsert({
    where: { id: "anonymous-public-user" },
    update: {},
    create: {
      id: "anonymous-public-user",
      email: "anonymous-public-submitter@hospital.org",
      firstName: "Public",
      lastName: "Submitter",
      passwordHash: "N/A_EXTERNAL_LINK_USER",
      roleId: (await prisma.role.findUnique({ where: { name: "RECEPTIONIST" } }))!.id,
    },
  });

  console.log("Done.");
  console.log(`Super Admin:     super@formix.dev / Passw0rd!`);
  console.log(`Hospital Admin:  admin@sunrise.dev / Passw0rd!`);
  console.log(`Doctor:          doctor@sunrise.dev / Passw0rd!`);
  console.log(`Nurse:           nurse@sunrise.dev / Passw0rd!`);
  console.log(`Receptionist:    reception@sunrise.dev / Passw0rd!`);
  console.log(`Sample form:     ${form.name} (${form.status})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });