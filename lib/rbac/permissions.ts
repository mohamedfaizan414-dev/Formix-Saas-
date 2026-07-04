import type { RoleName } from "@prisma/client";

// Permission keys grouped by module, mirroring the capability matrix in the
// product spec (Super Admin / Hospital Admin / Doctor / Nurse / Receptionist).
export type PermissionKey =
  | "form.create"
  | "form.edit"
  | "form.delete"
  | "form.publish"
  | "form.archive"
  | "form.clone"
  | "form.importExport"
  | "template.manage"
  | "hospital.manage"
  | "user.manage"
  | "permission.manage"
  | "auditLog.view"
  | "analytics.view"
  | "submission.view"
  | "submission.viewOwnHospital"
  | "submission.create"
  | "submission.edit"
  | "version.manage"
  | "form.assignToHospital"
  | "hospital.toggleActive";

const MATRIX: Record<RoleName, PermissionKey[]> = {
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

export function roleHasPermission(role: RoleName, permission: PermissionKey): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: RoleName): PermissionKey[] {
  return MATRIX[role] ?? [];
}

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Super Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
};

export const ROLE_DASHBOARD_PATH: Record<RoleName, string> = {
  SUPER_ADMIN: "/dashboard",
  HOSPITAL_ADMIN: "/dashboard",
  DOCTOR: "/dashboard",
  NURSE: "/dashboard",
  RECEPTIONIST: "/dashboard",
};