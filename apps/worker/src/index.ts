import {
  backfillMonobankStatement,
  backfillMonobankStatementRange,
  classifyMonobankExpenses,
  completeJob,
  deliverPendingTelegramNotifications,
  exportExpensesToGoogleSheets,
  failJob,
  getDb,
  matchExpenses,
  nextPendingJob,
  rescueStuckJobs,
  runNotificationSweep,
} from "@resource-manager/server";
import { redactSecrets } from "@resource-manager/shared";

const POLL_INTERVAL_MS = 5_000;
const NOTIFICATION_DELIVERY_INTERVAL_MS = 15_000;
const NOTIFICATION_SWEEP_INTERVAL_MS = 60_000;

console.log("resource-manager worker started");

const rescued = await rescueStuckJobs();
if (rescued > 0) {
  console.log(`rescued ${rescued} stuck job(s) from RUNNING state`);
}

let running = true;
let lastNotificationDeliveryAt = 0;
let lastNotificationSweepAt = 0;

process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

while (running) {
  if (Date.now() - lastNotificationSweepAt > NOTIFICATION_SWEEP_INTERVAL_MS) {
    lastNotificationSweepAt = Date.now();
    await runNotificationSweep().catch((error) => {
      console.error(redactSecrets(error));
    });
  }

  if (Date.now() - lastNotificationDeliveryAt > NOTIFICATION_DELIVERY_INTERVAL_MS) {
    lastNotificationDeliveryAt = Date.now();
    await deliverPendingTelegramNotifications().catch((error) => {
      console.error(redactSecrets(error));
    });
  }

  const job = await nextPendingJob();

  if (!job) {
    await sleep(POLL_INTERVAL_MS);
    continue;
  }

  try {
    if (job.type === "match_expenses") {
      const payload = job.payloadJson as { monoTransactionId?: string; telegramEntryId?: string; userId?: string };
      const matched = await matchExpenses(payload);
      console.log(`match_expenses done, matched=${matched}`);
    } else if (job.type === "export_google_sheets") {
      const payload = job.payloadJson as { userId?: string };
      const exported = await exportExpensesToGoogleSheets(payload.userId);
      console.log(`export_google_sheets done, exported=${exported}`);
    } else if (job.type === "monobank_backfill") {
      const payload = job.payloadJson as { accountId?: string; days?: number; from?: string; source?: string; to?: string; userId?: string };
      const imported =
        payload.from && payload.to
          ? await backfillMonobankStatementRange({
              accountId: payload.accountId,
              from: payload.from,
              source: payload.source ?? "monobank_backfill",
              to: payload.to,
              userId: payload.userId,
            })
          : await backfillMonobankStatement(payload.days ?? 31, payload.userId);
      console.log(`monobank_backfill done, imported=${imported}`);
    } else if (job.type === "classify_monobank_expenses") {
      const payload = job.payloadJson as { expenseIds?: string[]; limit?: number; userId?: string };
      const result = await classifyMonobankExpenses({
        expenseIds: payload.expenseIds,
        limit: payload.limit,
        userId: payload.userId,
      });
      console.log(
        `classify_monobank_expenses done, classified=${result.classified}, createdCategories=${result.createdCategories}, skipped=${result.skipped}`,
      );
    } else {
      console.warn(`unknown job type=${job.type}`);
    }

    await completeJob(job.id);
  } catch (error) {
    console.error(redactSecrets(error));
    await failJob(job.id, error);
  }
}

await getDb().$disconnect();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
