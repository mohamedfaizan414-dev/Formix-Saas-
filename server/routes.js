const express = require("express");
const crypto = require("crypto");
const { nanoid } = require("nanoid");

const { prisma, withDbRetry } = require("./lib/prisma");
const { comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken } = require("./lib/auth/jwt");
const { roleHasPermission } = require("./lib/rbac/permissions");
const { writeAuditLog } = require("./lib/audit/log");
const { PatientService } = require("./lib/services/patient-service");
const { uploadDataUri } = require("./lib/cloudinary/upload");
const { generateFormSchemaFromPrompt } = require("./lib/ai/generate-form");

const { 
  requireAuth, 
  requireRole, 
  requirePermission, 
  ACCESS_COOKIE_NAME, 
  REFRESH_COOKIE_NAME 
} = require("./middleware/auth");

const router = express.Router();

const ANONYMOUS_SYSTEM_USER_ID = "anonymous-public-user";

const ROLE_DASHBOARD_PATH = {
  SUPER_ADMIN: "/dashboard",
  HOSPITAL_ADMIN: "/dashboard",
  DOCTOR: "/dashboard",
  NURSE: "/dashboard",
  RECEPTIONIST: "/dashboard",
};

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// POST /api/auth/login
router.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await withDbRetry(() =>
    prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      include: { role: true },
    })
  );

  const ip = req.headers["x-forwarded-for"] || req.ip;

  if (!user || user.deletedAt || !user.isActive) {
    await writeAuditLog({ action: "auth.loginFailed", entityType: "user", metadata: { email }, ipAddress: ip });
    return res.status(401).json({ error: "That email or password isn't right." });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    await writeAuditLog({ action: "auth.loginFailed", entityType: "user", entityId: user.id, ipAddress: ip });
    return res.status(401).json({ error: "That email or password isn't right." });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role.name,
    hospitalId: user.hospitalId,
    departmentId: user.departmentId,
    email: user.email,
  });
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: crypto.createHash("sha256").update(jti).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog({
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    userId: user.id,
    hospitalId: user.hospitalId,
    ipAddress: ip,
  });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 15, // 15 mins
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    },
    redirectTo: ROLE_DASHBOARD_PATH[user.role.name],
  });
});

// POST /api/auth/logout
router.post("/api/auth/logout", (req, res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get("/api/auth/me", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { role: true, hospital: true },
  });

  if (!user || !user.isActive || user.deletedAt) {
    return res.status(401).json({ user: null });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      hospital: user.hospital ? user.hospital.name : null,
      hospitalId: user.hospitalId,
    },
  });
});

// POST /api/auth/refresh
router.post("/api/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash("sha256").update(payload.jti).digest("hex");
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token expired" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
    if (!user || !user.isActive || user.deletedAt) {
      return res.status(401).json({ error: "User inactive" });
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role.name,
      hospitalId: user.hospitalId,
      departmentId: user.departmentId,
      email: user.email,
    });

    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 1000 * 60 * 15,
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ==========================================
// 2. DASHBOARD ROUTES (Custom Endpoint for MERN)
// ==========================================

// GET /api/dashboard
router.get("/api/dashboard", requireAuth, async (req, res) => {
  const isBuilderRole = req.user.role === "SUPER_ADMIN" || req.user.role === "HOSPITAL_ADMIN";
  const hospitalWhere = req.user.role === "SUPER_ADMIN" ? {} : { hospitalId: req.user.hospitalId || undefined };

  const nonDeletedFormWhere = {
    OR: [
      { deletedAt: null },
      { deletedAt: { isSet: false } }
    ]
  };

  if (isBuilderRole) {
    try {
      const [formCount, publishedCount, submissionCount, hospitalCount] = await Promise.all([
        prisma.form.count({ where: { ...nonDeletedFormWhere, ...hospitalWhere } }),
        prisma.form.count({ where: { ...nonDeletedFormWhere, status: "PUBLISHED", ...hospitalWhere } }),
        prisma.submission.count({ where: hospitalWhere }),
        req.user.role === "SUPER_ADMIN" ? prisma.hospital.count() : Promise.resolve(1),
      ]);

      const recentForms = await prisma.form.findMany({
        where: { ...nonDeletedFormWhere, ...hospitalWhere },
        orderBy: { updatedAt: "desc" },
        take: 6,
      });

      return res.json({
        stats: { formCount, publishedCount, submissionCount, hospitalCount },
        recentForms,
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to load builder dashboard stats." });
    }
  }

  // Clinical Roles
  try {
    const publishedForms = await prisma.form.findMany({
      where: { status: "PUBLISHED", hospitalId: req.user.hospitalId || undefined, ...nonDeletedFormWhere },
      orderBy: { name: "asc" },
    });
    
    const myDrafts = await prisma.submission.findMany({
      where: { submittedById: req.user.sub, status: "DRAFT" },
      include: { form: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    return res.json({
      publishedForms,
      myDrafts,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load clinical dashboard stats." });
  }
});

// ==========================================
// 3. FORMS ROUTES
// ==========================================

// GET /api/forms
router.get("/api/forms", requireAuth, async (req, res) => {
  const status = req.query.status || undefined;

  const where = {
    OR: [
      { deletedAt: null },
      { deletedAt: { isSet: false } }
    ]
  };
  if (req.user.role !== "SUPER_ADMIN") {
    if (!req.user.hospitalId) return res.json({ forms: [] });
    where.hospitalId = req.user.hospitalId;
  }
  if (status) where.status = status;

  const forms = await prisma.form.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { 
      hospital: { select: { name: true } }, 
      createdBy: { select: { firstName: true, lastName: true } } 
    },
  });

  return res.json({ forms });
});

// POST /api/forms
router.post("/api/forms", requireAuth, requirePermission("form.create"), async (req, res) => {
  if (!req.user.hospitalId && req.user.role !== "SUPER_ADMIN") {
    return res.status(400).json({ error: "No hospital assigned to your account." });
  }

  const { name, description, category, hospitalId: hospitalIdInput, departmentId, schema: initialSchema } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: "Form name is required." });

  const hospitalId = req.user.role === "SUPER_ADMIN" ? hospitalIdInput : req.user.hospitalId;
  if (!hospitalId) return res.status(400).json({ error: "hospitalId is required." });

  const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(5)}`;

  const schema = initialSchema || {
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
      createdById: req.user.sub,
      versions: {
        create: {
          versionNumber: 1,
          schema: schema,
          createdById: req.user.sub,
        },
      },
    },
    include: { versions: true },
  });

  await writeAuditLog({
    action: "form.created",
    entityType: "form",
    entityId: form.id,
    userId: req.user.sub,
    hospitalId,
  });

  return res.json({ form });
});

// GET /api/forms/:id
router.get("/api/forms/:id", async (req, res) => {
  const { id } = req.params;

  // If no auth user session exists
  if (!req.user) {
    const form = await prisma.form.findFirst({ 
      where: { 
        id, 
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
      } 
    });
    if (!form || form.status !== "PUBLISHED") {
      return res.status(404).json({ error: "Form not found or unavailable." });
    }

    const versions = await prisma.formVersion.findMany({
      where: { formId: id },
      orderBy: { versionNumber: "desc" },
      take: 1,
    });

    return res.json({ 
      form, 
      versions, 
      latestSchema: versions[0]?.schema ?? null,
      hasSession: false
    });
  }

  // Authenticated flow
  const form = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!form) return res.status(404).json({ error: "Form not found" });
  
  const allowed = req.user.role === "SUPER_ADMIN" || form.hospitalId === req.user.hospitalId;
  if (!allowed) return res.status(403).json({ error: "Not authorized for this hospital's data." });

  const versions = await prisma.formVersion.findMany({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
  });

  return res.json({ 
    form, 
    versions, 
    latestSchema: versions[0]?.schema ?? null,
    hasSession: true,
    user: req.user
  });
});

// PUT /api/forms/:id
router.put("/api/forms/:id", requireAuth, requirePermission("form.edit"), async (req, res) => {
  const { id } = req.params;
  const form = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!form) return res.status(404).json({ error: "Form not found" });

  const allowed = req.user.role === "SUPER_ADMIN" || form.hospitalId === req.user.hospitalId;
  if (!allowed) return res.status(403).json({ error: "Not authorized for this hospital's data." });

  const { schema, changelog, name, description } = req.body;
  const nextVersionNumber = form.currentVersion + 1;

  const [, version] = await prisma.$transaction([
    prisma.form.update({
      where: { id },
      data: {
        name: name !== undefined ? name : form.name,
        description: description !== undefined ? description : form.description,
        currentVersion: nextVersionNumber,
      },
    }),
    prisma.formVersion.create({
      data: {
        formId: id,
        versionNumber: nextVersionNumber,
        schema: schema,
        changelog,
        createdById: req.user.sub,
      },
    }),
  ]);

  await writeAuditLog({
    action: "form.updated",
    entityType: "form",
    entityId: id,
    userId: req.user.sub,
    hospitalId: form.hospitalId,
    metadata: { versionNumber: nextVersionNumber },
  });

  return res.json({ version });
});

// DELETE /api/forms/:id
router.delete("/api/forms/:id", requireAuth, requirePermission("form.delete"), async (req, res) => {
  const { id } = req.params;
  const form = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!form) return res.status(404).json({ error: "Form not found" });

  const allowed = req.user.role === "SUPER_ADMIN" || form.hospitalId === req.user.hospitalId;
  if (!allowed) return res.status(403).json({ error: "Not authorized for this hospital's data." });

  await prisma.form.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog({ action: "form.deleted", entityType: "form", entityId: id, userId: req.user.sub, hospitalId: form.hospitalId });

  return res.json({ ok: true });
});

// POST /api/forms/:id/clone
router.post("/api/forms/:id/clone", requireAuth, requirePermission("form.clone"), async (req, res) => {
  const { id } = req.params;
  const source = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!source) return res.status(404).json({ error: "Form not found" });
  
  if (req.user.role !== "SUPER_ADMIN" && source.hospitalId !== req.user.hospitalId) {
    return res.status(403).json({ error: "Not authorized for this hospital's data." });
  }

  const latest = await prisma.formVersion.findFirst({ where: { formId: id }, orderBy: { versionNumber: "desc" } });

  const clone = await prisma.form.create({
    data: {
      hospitalId: source.hospitalId,
      departmentId: source.departmentId,
      name: `${source.name} (Copy)`,
      slug: `${source.slug}-copy-${nanoid(5)}`,
      description: source.description,
      category: source.category,
      status: "DRAFT",
      createdById: req.user.sub,
      versions: {
        create: { versionNumber: 1, schema: latest?.schema ?? {}, createdById: req.user.sub },
      },
    },
  });

  await writeAuditLog({ 
    action: "form.cloned", 
    entityType: "form", 
    entityId: clone.id, 
    userId: req.user.sub, 
    hospitalId: source.hospitalId, 
    metadata: { sourceFormId: id } 
  });

  return res.json({ form: clone });
});

// POST /api/forms/:id/publish
router.post("/api/forms/:id/publish", requireAuth, requirePermission("form.publish"), async (req, res) => {
  const { id } = req.params;
  const form = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!form) return res.status(404).json({ error: "Form not found" });

  if (req.user.role !== "SUPER_ADMIN" && form.hospitalId !== req.user.hospitalId) {
    return res.status(403).json({ error: "Not authorized for this hospital's data." });
  }

  const publish = req.body.publish !== undefined ? req.body.publish : true;

  const latestVersion = await prisma.formVersion.findFirst({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
  });
  if (!latestVersion) return res.status(400).json({ error: "No version to publish." });

  await prisma.$transaction([
    prisma.form.update({ where: { id }, data: { status: publish ? "PUBLISHED" : "DRAFT" } }),
    prisma.formVersion.update({
      where: { id: latestVersion.id },
      data: { isPublished: publish, publishedAt: publish ? new Date() : null },
    }),
  ]);

  await writeAuditLog({
    action: publish ? "form.published" : "form.unpublished",
    entityType: "form",
    entityId: id,
    userId: req.user.sub,
    hospitalId: form.hospitalId,
  });

  return res.json({ ok: true });
});

// GET /api/forms/:id/versions
router.get("/api/forms/:id/versions", requireAuth, async (req, res) => {
  const { id } = req.params;
  const form = await prisma.form.findFirst({ 
    where: { 
      id, 
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] 
    } 
  });
  if (!form) return res.status(404).json({ error: "Form not found" });

  if (req.user.role !== "SUPER_ADMIN" && form.hospitalId !== req.user.hospitalId) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const versions = await prisma.formVersion.findMany({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });

  return res.json({ versions });
});

// ==========================================
// 4. HOSPITALS ROUTES
// ==========================================

// GET /api/hospitals
router.get("/api/hospitals", requireAuth, requireRole("SUPER_ADMIN"), async (req, res) => {
  const hospitals = await prisma.hospital.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { forms: true, users: true } } },
  });
  return res.json({ hospitals });
});

// POST /api/hospitals
router.post("/api/hospitals", requireAuth, requireRole("SUPER_ADMIN"), async (req, res) => {
  const { name, address, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Organization name is required." });
  }

  const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.hospital.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const hospital = await prisma.hospital.create({
    data: { name: name.trim(), slug, address, phone, isActive: true },
  });

  await writeAuditLog({
    action: "hospital.created",
    entityType: "hospital",
    entityId: hospital.id,
    userId: req.user.sub,
    hospitalId: hospital.id,
  });

  return res.json({ hospital });
});

// DELETE /api/hospitals/:id
router.delete("/api/hospitals/:id", requireAuth, requireRole("SUPER_ADMIN"), async (req, res) => {
  const { id } = req.params;

  try {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      return res.status(404).json({ error: "Organization not found." });
    }

    await prisma.hospital.delete({
      where: { id }
    });

    await writeAuditLog({
      action: "form.deleted", // Audit logging matches app structure
      entityType: "hospital",
      entityId: id,
      userId: req.user.sub,
      metadata: { name: hospital.name, slug: hospital.slug }
    });

    return res.json({ ok: true, message: "Organization and all related clinical datasets successfully purged." });
  } catch (error) {
    console.error("Critical error during hospital cascading delete:", error);
    return res.status(500).json({ error: "Internal server error processing cascading data deletion." });
  }
});

// POST /api/hospitals/:id/toggle
router.post("/api/hospitals/:id/toggle", requireAuth, requireRole("SUPER_ADMIN"), async (req, res) => {
  const { id } = req.params;
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.hospital.update({ where: { id }, data: { isActive: !hospital.isActive } });
  await writeAuditLog({ action: "hospital.toggled", entityType: "hospital", entityId: id, userId: req.user.sub, metadata: { isActive: updated.isActive } });

  return res.json({ hospital: updated });
});

// ==========================================
// 5. PATIENTS ROUTES
// ==========================================

// GET /api/patients
router.get("/api/patients", requireAuth, async (req, res) => {
  const userCtx = {
    id: req.user.sub,
    role: req.user.role,
    organizationId: req.user.hospitalId ?? null,
  };

  try {
    const patients = await PatientService.getPatients(userCtx);
    let hospitals = [];
    if (req.user.role === "SUPER_ADMIN") {
      hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
    }
    return res.json({ patients, hospitals });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch patient records." });
  }
});

// GET /api/patients/:id
router.get("/api/patients/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userCtx = {
    id: req.user.sub,
    role: req.user.role,
    organizationId: req.user.hospitalId ?? null,
  };

  try {
    const patientData = await PatientService.getPatientDetails(id, userCtx);

    const availableFormTemplates = await prisma.form.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        ...(req.user.role === "SUPER_ADMIN" ? {} : { hospitalId: req.user.hospitalId ?? "" }),
      },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });

    const sanitizedTemplates = availableFormTemplates.map((f) => ({ id: f.id, title: f.name }));

    const submittedVersionIds = patientData.assignments
      .filter((a) => a.status === "SUBMITTED")
      .map((a) => a.formVersionId);

    const versions = submittedVersionIds.length
      ? await prisma.formVersion.findMany({
          where: { id: { in: submittedVersionIds } },
          select: { id: true, schema: true },
        })
      : [];

    const versionSchemaById = {};
    versions.forEach((v) => {
      versionSchemaById[v.id] = v.schema;
    });

    return res.json({
      patientData,
      availableForms: sanitizedTemplates,
      versionSchemaById,
    });
  } catch (err) {
    return res.status(404).json({ error: err.message || "Patient profile not found." });
  }
});

// POST /api/patients
router.post("/api/patients", requireAuth, async (req, res) => {
  const action = req.query.action;
  const userCtx = {
    id: req.user.sub,
    role: req.user.role,
    organizationId: req.user.hospitalId ?? null,
  };

  try {
    if (action === "assign") {
      const { patientId, formId, formIds } = req.body;
      if (!patientId) return res.status(400).json({ error: "patientId is required." });
      if (!formId && (!formIds || formIds.length === 0)) {
        return res.status(400).json({ error: "Either formId or formIds must be provided." });
      }

      const targetedFormIds = formIds && formIds.length > 0 ? formIds : [formId];

      const assignmentBatchResult = await Promise.all(
        targetedFormIds.map((targetFormId) => 
          PatientService.assignForm(patientId, targetFormId, userCtx)
        )
      );

      return res.status(201).json({ 
        success: true, 
        count: assignmentBatchResult.length 
      });
    }

    // Creating Patient Profile
    const { email, firstName, lastName, phone, organizationId } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const patient = await PatientService.createPatient({
      email, firstName, lastName, phone, organizationId
    }, userCtx);

    return res.status(201).json({ patient });
  } catch (err) {
    console.error("Patient route exception:", err);
    return res.status(500).json({ error: err.message || "Operation failed." });
  }
});

// DELETE /api/patients
router.delete("/api/patients", requireAuth, async (req, res) => {
  const id = req.query.id;
  const type = req.query.type;

  if (!id) return res.status(400).json({ error: "Missing required ID parameter." });

  try {
    if (type === "assignment") {
      await prisma.formAssignment.delete({ where: { id } });
      return res.json({ success: true });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      const targetedRecord = await prisma.patient.findUnique({ where: { id } });
      if (!targetedRecord || targetedRecord.organizationId !== req.user.hospitalId) {
        return res.status(403).json({ error: "Cross-tenant data mutation access denied." });
      }
    }

    await prisma.patient.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error("Patient delete transaction failure:", err);
    return res.status(500).json({ error: "Internal operational database breakdown." });
  }
});

// DELETE /api/patients/assign-form
router.delete("/api/patients/assign-form", requireAuth, async (req, res) => {
  const assignmentId = req.query.id;

  if (!assignmentId) {
    return res.status(400).json({ error: "Missing required assignment ID parameter." });
  }

  try {
    await prisma.formAssignment.delete({
      where: { id: assignmentId },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Database assignment deletion transaction failure:", error);
    return res.status(500).json({ error: "Internal execution breakdown." });
  }
});

// ==========================================
// 6. SUBMISSIONS ROUTES
// ==========================================

// GET /api/submissions
router.get("/api/submissions", requireAuth, async (req, res) => {
  const formId = req.query.formId || undefined;
  const where = {};
  if (req.user.role !== "SUPER_ADMIN") {
    if (!req.user.hospitalId) return res.json({ submissions: [] });
    where.hospitalId = req.user.hospitalId;
  }
  if (formId) where.formId = formId;

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { 
      submittedBy: { select: { firstName: true, lastName: true } }, 
      form: { select: { name: true } } 
    },
    take: 200,
  });

  const assignmentWhere = { status: "SUBMITTED" };
  if (formId) assignmentWhere.formId = formId;
  if (req.user.role !== "SUPER_ADMIN") {
    assignmentWhere.form = { hospitalId: req.user.hospitalId || undefined };
  }

  const assignments = await prisma.formAssignment.findMany({
    where: assignmentWhere,
    orderBy: { submittedAt: "desc" },
    include: {
      patient: true,
      form: { select: { name: true, hospitalId: true } }
    },
    take: 200,
  });

  const mappedAssignments = assignments.map(a => ({
    id: a.id,
    formId: a.formId,
    formVersionId: a.formVersionId,
    hospitalId: a.form.hospitalId,
    status: a.status,
    data: a.payload,
    submittedBy: {
      firstName: a.patient.firstName || "Patient",
      lastName: a.patient.lastName || ""
    },
    createdAt: a.submittedAt || a.sentAt,
    isAssignment: true,
  }));

  const combined = [...submissions, ...mappedAssignments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return res.json({ submissions: combined });
});

// POST /api/submissions
router.post("/api/submissions", async (req, res) => {
  const { formId, formVersionId, data, patientId, encounterId, submit, isPublic } = req.body;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }]
    }
  });
  if (!form) return res.status(404).json({ error: "Form not found" });

  const processAsPublicForm = isPublic === true || !req.user;

  if (processAsPublicForm) {
    if (form.status !== "PUBLISHED") {
      return res.status(403).json({ error: "This form is not accepting public link submissions." });
    }
  } else {
    if (!roleHasPermission(req.user.role, "submission.create")) {
      return res.status(403).json({ error: "You don't have permission to submit forms." });
    }
    if (req.user.role !== "SUPER_ADMIN" && form.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ error: "Not authorized for this hospital's data." });
    }
  }

  const sanitizedJsonPayload = JSON.parse(JSON.stringify(data || {}));

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
        submittedById: !processAsPublicForm ? req.user.sub : ANONYMOUS_SYSTEM_USER_ID,
        submittedAt: submit ? new Date() : null,
      },
    });

    await writeAuditLog({
      action: "submission.created",
      entityType: "submission",
      entityId: submission.id,
      userId: !processAsPublicForm ? req.user.sub : null,
      hospitalId: form.hospitalId,
      metadata: {
        formId,
        status: submission.status,
        isPublicLinkSubmission: processAsPublicForm,
        submitterLabel: processAsPublicForm ? "anonymous_public_client" : `User #${req.user.sub}`
      },
    });

    return res.json({ submission });
  } catch (error) {
    console.error("Prisma error at root ingestion write path:", error);
    return res.status(500).json({ error: "Internal write validation anomaly." });
  }
});

// GET /api/submissions/:id
router.get("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;

  let submission = await prisma.submission.findUnique({
    where: { id },
    include: { formVersion: true, form: true, submittedBy: { select: { firstName: true, lastName: true } } },
  });

  if (!submission) {
    const assignment = await prisma.formAssignment.findUnique({
      where: { id },
      include: { formVersion: true, form: { include: { hospital: true } }, patient: true },
    });

    if (assignment) {
      submission = {
        id: assignment.id,
        formId: assignment.formId,
        formVersionId: assignment.formVersionId,
        hospitalId: assignment.form.hospitalId,
        status: assignment.status,
        data: assignment.payload,
        submittedById: null,
        submittedBy: {
          firstName: assignment.patient.firstName || "Patient",
          lastName: assignment.patient.lastName || "",
        },
        formVersion: assignment.formVersion,
        form: assignment.form,
        createdAt: assignment.submittedAt || assignment.sentAt,
        updatedAt: assignment.submittedAt || assignment.sentAt,
      };
    }
  }

  if (!submission) return res.status(404).json({ error: "Not found" });

  if (!req.user) {
    const isResumableAnonymousDraft = !submission.submittedById && submission.form.status === "PUBLISHED";
    if (!isResumableAnonymousDraft) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    return res.json({ submission });
  }

  if (req.user.role !== "SUPER_ADMIN" && submission.hospitalId !== req.user.hospitalId) {
    return res.status(403).json({ error: "Not authorized" });
  }

  return res.json({ submission });
});

// PUT /api/submissions/:id
router.put("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.submission.findUnique({ where: { id }, include: { form: true } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const isAnonymousDraftOwner = !req.user && !existing.submittedById && existing.form.status === "PUBLISHED";

  if (req.user) {
    if (!roleHasPermission(req.user.role, "submission.edit")) {
      return res.status(403).json({ error: "You don't have permission to edit submissions." });
    }
    if (req.user.role !== "SUPER_ADMIN" && existing.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ error: "Not authorized" });
    }
  } else if (!isAnonymousDraftOwner) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const { data, submit } = req.body;

  const [, updated] = await prisma.$transaction([
    prisma.submissionVersion.create({
      data: {
        submissionId: id,
        data: existing.data,
        editedById: req.user ? req.user.sub : ANONYMOUS_SYSTEM_USER_ID,
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
    userId: req.user ? req.user.sub : "anonymous_public_client",
    hospitalId: existing.hospitalId,
  });

  return res.json({ submission: updated });
});

// DELETE /api/submissions/:id/delete
router.delete("/api/submissions/:id/delete", requireAuth, requirePermission("submission.edit"), async (req, res) => {
  const { id } = req.params;

  const sub = await prisma.submission.findUnique({ where: { id } });
  if (sub) {
    if (req.user.role !== "SUPER_ADMIN" && sub.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.submission.delete({ where: { id } });

    await writeAuditLog({
      action: "submission.updated",
      entityType: "submission",
      entityId: id,
      userId: req.user.sub,
      hospitalId: sub.hospitalId,
    });

    return res.json({ success: true });
  }

  const assignment = await prisma.formAssignment.findUnique({
    where: { id },
    include: { form: true },
  });
  if (assignment) {
    if (req.user.role !== "SUPER_ADMIN" && assignment.form.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.formAssignment.delete({ where: { id } });

    await writeAuditLog({
      action: "submission.updated",
      entityType: "submission",
      entityId: id,
      userId: req.user.sub,
      hospitalId: assignment.form.hospitalId,
    });

    return res.json({ success: true });
  }

  return res.status(404).json({ error: "Not found" });
});

// ==========================================
// 7. PUBLIC-FORMS ROUTES
// ==========================================

// GET /api/public-forms/:token
router.get("/api/public-forms/:token", async (req, res) => {
  const { token } = req.params;

  const assignment = await prisma.formAssignment.findUnique({
    where: { token },
    include: {
      formVersion: true,
      patient: true,
    },
  });

  if (!assignment) {
    return res.status(404).json({ error: "Form assignment link not found or expired." });
  }

  return res.json({ assignment });
});

// POST /api/public-forms/:token/submit
router.post("/api/public-forms/:token/submit", async (req, res) => {
  const { token } = req.params;
  const { values, isDraft } = req.body;

  try {
    await PatientService.recordSubmission(token, values, isDraft);
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to record public form submission." });
  }
});

// ==========================================
// 8. UPLOAD ROUTES
// ==========================================

// POST /api/upload
router.post("/api/upload", async (req, res) => {
  let uploaderId = ANONYMOUS_SYSTEM_USER_ID;

  if (req.user) {
    uploaderId = req.user.sub;
  } else {
    const assignmentToken = req.headers["x-assignment-token"] || req.query.token;
    if (!assignmentToken) {
      return res.status(401).json({ error: "Unauthenticated: require session or assignment token" });
    }

    const assignment = await prisma.formAssignment.findUnique({
      where: { token: assignmentToken }
    });
    if (!assignment) {
      return res.status(401).json({ error: "Unauthenticated: invalid assignment token" });
    }
  }

  const { dataUri, resourceType, folder, originalName } = req.body;
  if (!dataUri) return res.status(400).json({ error: "dataUri is required" });

  try {
    const result = await uploadDataUri(dataUri, {
      folder: `formix/${folder || "uploads"}`,
      resourceType: resourceType || "auto",
    });

    const asset = await prisma.fileAsset.create({
      data: {
        uploadedById: uploaderId,
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        originalName,
        bytes: result.bytes,
      },
    });

    return res.json({ asset });
  } catch (err) {
    console.error("Cloudinary upload route error:", err);
    return res.status(502).json({ error: "Upload failed. Check Cloudinary credentials." });
  }
});

// ==========================================
// 9. USERS ROUTES
// ==========================================

// GET /api/users
router.get("/api/users", requireAuth, async (req, res) => {
  const where = {
    OR: [
      { deletedAt: null },
      { deletedAt: { isSet: false } }
    ]
  };
  if (req.user.role !== "SUPER_ADMIN") where.hospitalId = req.user.hospitalId;

  const users = await prisma.user.findMany({
    where,
    include: { role: true, hospital: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ users });
});

// POST /api/users
router.post("/api/users", requireAuth, requirePermission("user.manage"), async (req, res) => {
  const { email, firstName, lastName, roleName, hospitalId: hospitalIdInput, password } = req.body;

  if (req.user.role === "HOSPITAL_ADMIN" && roleName === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Hospital Admins cannot create Super Admins." });
  }

  const hospitalId = req.user.role === "SUPER_ADMIN" ? hospitalIdInput : req.user.hospitalId;
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return res.status(400).json({ error: "Invalid role" });

  const passwordHash = await hashPassword(password || "Passw0rd!");

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), firstName, lastName, passwordHash, roleId: role.id, hospitalId },
  });

  await writeAuditLog({ action: "user.created", entityType: "user", entityId: user.id, userId: req.user.sub, hospitalId });

  return res.json({ user });
});

// GET /api/audit-logs
router.get("/api/audit-logs", requireAuth, async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== "SUPER_ADMIN") {
      where.hospitalId = req.user.hospitalId || undefined;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    return res.json({ logs });
  } catch (err) {
    console.error("Audit log retrieval failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// 10. AI GENERATION ROUTES
// ==========================================

// POST /api/ai/generate-form
router.post("/api/ai/generate-form", requireAuth, requirePermission("form.create"), async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: "Describe the form you want first." });

  try {
    const schema = await generateFormSchemaFromPrompt(prompt);
    return res.json({ schema });
  } catch (err) {
    console.error("AI form generation route exception:", err);
    return res.status(502).json({ error: err.message || "AI generation failed. Check GROQ_API_KEY." });
  }
});

module.exports = router;
