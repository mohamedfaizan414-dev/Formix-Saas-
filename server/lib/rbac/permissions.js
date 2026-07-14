const MATRIX = {
  SUPER_ADMIN: [
    "form.create", "form.edit", "form.delete", "form.publish", "form.archive",
    "form.clone", "form.importExport", "template.manage", "hospital.manage",
    "user.manage", "permission.manage", "auditLog.view", "analytics.view",
    "submission.view", "version.manage", "form.assignToHospital", "hospital.toggleActive",
    "submission.edit"
  ],
  HOSPITAL_ADMIN: [
    "form.create", "form.edit", "form.publish", "form.clone", "template.manage",
    "version.manage", "user.manage", "submission.viewOwnHospital", "analytics.view",
    "submission.edit"
  ],
  DOCTOR: ["submission.create", "submission.edit", "submission.viewOwnHospital"],
  NURSE: ["submission.create", "submission.edit", "submission.viewOwnHospital"],
  RECEPTIONIST: ["submission.create", "submission.viewOwnHospital"],
};

function roleHasPermission(role, permission) {
  return MATRIX[role] ? MATRIX[role].includes(permission) : false;
}

function permissionsForRole(role) {
  return MATRIX[role] || [];
}

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
};

const ROLE_DASHBOARD_PATH = {
  SUPER_ADMIN: "/dashboard",
  HOSPITAL_ADMIN: "/dashboard",
  DOCTOR: "/dashboard",
  NURSE: "/dashboard",
  RECEPTIONIST: "/dashboard",
};

module.exports = {
  roleHasPermission,
  permissionsForRole,
  ROLE_LABELS,
  ROLE_DASHBOARD_PATH,
};
