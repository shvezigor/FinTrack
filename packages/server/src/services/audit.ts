import { Prisma } from "@prisma/client";
import { getDb } from "../db.js";

export type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: {
  action: string;
  context?: AuditContext;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Prisma.InputJsonValue;
  userId?: string | null;
}) {
  await getDb().auditLog.create({
    data: {
      action: input.action,
      entityId: input.entityId ?? null,
      entityType: input.entityType ?? null,
      ipAddress: input.context?.ipAddress ?? null,
      metadata: input.metadata ?? undefined,
      userAgent: input.context?.userAgent ?? null,
      userId: input.userId ?? null,
    },
  });
}

export async function cleanupExpiredSecurityRecords(options: { auditRetentionDays?: number } = {}) {
  const auditRetentionDays = options.auditRetentionDays ?? 365;
  const auditBefore = new Date(Date.now() - auditRetentionDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  await Promise.all([
    getDb().authState.deleteMany({ where: { expiresAt: { lt: now } } }),
    getDb().setupState.deleteMany({ where: { expiresAt: { lt: now } } }),
    getDb().userSession.deleteMany({ where: { expiresAt: { lt: now } } }),
    getDb().auditLog.deleteMany({ where: { createdAt: { lt: auditBefore } } }),
  ]);
}
