import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.loginFailed"
  | "form.created"
  | "form.updated"
  | "form.published"
  | "form.unpublished"
  | "form.archived"
  | "form.deleted"
  | "form.cloned"
  | "component.added"
  | "component.deleted"
  | "submission.created"
  | "submission.updated"
  | "user.created"
  | "user.updated"
  | "permission.changed"
  | "hospital.created"
  | "hospital.created"
  | "hospital.toggled";

interface AuditInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string | null;
  hospitalId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId ?? undefined,
      hospitalId: input.hospitalId ?? undefined,
      metadata: input.metadata as any,
      ipAddress: input.ipAddress ?? undefined,
    },
  });
}