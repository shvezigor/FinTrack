import { cleanupFintrackE2eData, disconnectFintrackE2eDb } from "./support/test-data";

export default async function globalTeardown() {
  await cleanupFintrackE2eData();
  await disconnectFintrackE2eDb();
}
