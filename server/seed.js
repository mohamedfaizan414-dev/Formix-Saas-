const fs = require("fs");
const path = require("path");

// Custom .env loader to load from parent directory
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { resolveMongoSrv } = require("./lib/dns-resolver");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");

const PERMISSION_KEYS = [
  "form.create", "form.edit", "form.delete", "form.publish", "form.archive", "form.clone",
  "form.importExport", "template.manage", "hospital.manage", "user.manage", "permission.manage",
  "auditLog.view", "analytics.view", "submission.view", "submission.viewOwnHospital",
  "submission.create", "submission.edit", "version.manage", "form.assignToHospital", "hospital.toggleActive",
];

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function runSeeder() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log("Seeding permissions & roles…");
    for (const key of PERMISSION_KEYS) {
      const existing = await prisma.permission.findUnique({ where: { key } });
      if (!existing) {
        await prisma.permission.create({ data: { key, label: key } });
      }
    }

    const roleNames = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"];
    for (const name of roleNames) {
      const existing = await prisma.role.findUnique({ where: { name } });
      if (!existing) {
        await prisma.role.create({ data: { name } });
      }
    }

    console.log("Seeding demo hospital…");
    let hospital = await prisma.hospital.findUnique({ where: { slug: "sunrise-general" } });
    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: { name: "Sunrise General Hospital", slug: "sunrise-general", isActive: true, address: "12 Chart Lane" },
      });
    }

    let opd = await prisma.department.findUnique({
      where: { hospitalId_name: { hospitalId: hospital.id, name: "OPD" } }
    });
    if (!opd) {
      opd = await prisma.department.create({
        data: { hospitalId: hospital.id, name: "OPD" },
      });
    }

    console.log("Seeding demo users (password: Passw0rd!)…");
    const passwordHash = await hashPassword("Passw0rd!");
    const roles = await prisma.role.findMany();
    const roleId = (name) => roles.find((r) => r.name === name).id;

    let superAdmin = await prisma.user.findUnique({ where: { email: "super@formix.dev" } });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: { email: "super@formix.dev", firstName: "Alex", lastName: "Reyes", passwordHash, roleId: roleId("SUPER_ADMIN") },
      });
    }

    let hospitalAdmin = await prisma.user.findUnique({ where: { email: "admin@sunrise.dev" } });
    if (!hospitalAdmin) {
      hospitalAdmin = await prisma.user.create({
        data: { email: "admin@sunrise.dev", firstName: "Priya", lastName: "Nair", passwordHash, roleId: roleId("HOSPITAL_ADMIN"), hospitalId: hospital.id },
      });
    }

    const doctor = await prisma.user.findUnique({ where: { email: "doctor@sunrise.dev" } });
    if (!doctor) {
      await prisma.user.create({
        data: { email: "doctor@sunrise.dev", firstName: "Rahul", lastName: "Menon", passwordHash, roleId: roleId("DOCTOR"), hospitalId: hospital.id, departmentId: opd.id },
      });
    }

    const nurse = await prisma.user.findUnique({ where: { email: "nurse@sunrise.dev" } });
    if (!nurse) {
      await prisma.user.create({
        data: { email: "nurse@sunrise.dev", firstName: "Leah", lastName: "Thomas", passwordHash, roleId: roleId("NURSE"), hospitalId: hospital.id, departmentId: opd.id },
      });
    }

    const reception = await prisma.user.findUnique({ where: { email: "reception@sunrise.dev" } });
    if (!reception) {
      await prisma.user.create({
        data: { email: "reception@sunrise.dev", firstName: "Sam", lastName: "George", passwordHash, roleId: roleId("RECEPTIONIST"), hospitalId: hospital.id, departmentId: opd.id },
      });
    }

    console.log("Seeding a sample published OPD assessment form…");
    const schema = {
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

    let form = await prisma.form.findUnique({
      where: { hospitalId_slug: { hospitalId: hospital.id, slug: "opd-assessment-form" } }
    });
    if (!form) {
      form = await prisma.form.create({
        data: {
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
            create: { versionNumber: 1, schema: schema, isPublished: true, publishedAt: new Date(), createdById: hospitalAdmin.id },
          },
        },
      });
    }

    console.log("Seeding anonymous public form user account…");
    const receptionistRole = await prisma.role.findUnique({ where: { name: "RECEPTIONIST" } });
    const anonUser = await prisma.user.findUnique({ where: { id: "anonymous-public-user" } });
    if (!anonUser) {
      await prisma.user.create({
        data: {
          id: "anonymous-public-user",
          email: "anonymous-public-submitter@hospital.org",
          firstName: "Public",
          lastName: "Submitter",
          passwordHash: "N/A_EXTERNAL_LINK_USER",
          roleId: receptionistRole.id,
        },
      });
    }

    console.log("Done.");
    console.log(`Super Admin:     super@formix.dev / Passw0rd!`);
    console.log(`Hospital Admin:  admin@sunrise.dev / Passw0rd!`);
    console.log(`Doctor:          doctor@sunrise.dev / Passw0rd!`);
    console.log(`Nurse:           nurse@sunrise.dev / Passw0rd!`);
    console.log(`Receptionist:    reception@sunrise.dev / Passw0rd!`);
    console.log(`Sample form:     ${form.name} (${form.status})`);
  } catch (err) {
    console.error("Seeder execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveMongoSrv(process.env.DATABASE_URL).then((resolvedUrl) => {
  process.env.DATABASE_URL = resolvedUrl;
  runSeeder();
});
