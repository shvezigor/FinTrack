import { Prisma } from "@prisma/client";
import { getDb } from "../db.js";

const MAX_JOB_ATTEMPTS = 5;
const STUCK_JOB_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function enqueueJob(
  type: string,
  payload: Prisma.InputJsonValue = {},
  options: { runAfter?: Date } = {},
) {
  return getDb().job.create({
    data: {
      payloadJson: payload,
      runAfter: options.runAfter,
      type,
    },
  });
}

export async function nextPendingJob() {
  const db = getDb();
  const job = await db.job.findFirst({
    orderBy: { createdAt: "asc" },
    where: {
      runAfter: { lte: new Date() },
      status: "PENDING",
    },
  });

  if (!job) {
    return null;
  }

  return db.job.update({
    data: {
      attempts: { increment: 1 },
      status: "RUNNING",
    },
    where: { id: job.id },
  });
}

export async function completeJob(id: string) {
  await getDb().job.update({
    data: { status: "DONE" },
    where: { id },
  });
}

export async function failJob(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const job = await getDb().job.findUnique({ where: { id }, select: { attempts: true } });
  const isExhausted = (job?.attempts ?? 0) >= MAX_JOB_ATTEMPTS;
  await getDb().job.update({
    data: {
      lastError: message.slice(0, 2000),
      ...(isExhausted
        ? { status: "FAILED" }
        : { runAfter: new Date(Date.now() + 60_000), status: "PENDING" }),
    },
    where: { id },
  });
}

export async function rescueStuckJobs(): Promise<number> {
  const stuckBefore = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);
  const result = await getDb().job.updateMany({
    where: {
      status: "RUNNING",
      updatedAt: { lt: stuckBefore },
    },
    data: {
      status: "PENDING",
      runAfter: new Date(),
      lastError: "rescued: job was stuck in RUNNING state",
    },
  });
  return result.count;
}
