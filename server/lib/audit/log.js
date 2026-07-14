const { prisma } = require("../prisma");

async function writeAuditLog(input) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId || undefined,
      hospitalId: input.hospitalId || undefined,
      metadata: input.metadata,
      ipAddress: input.ipAddress || undefined,
    },
  });
}

module.exports = {
  writeAuditLog,
};
