import { execFileSync } from "node:child_process";

import { cleanupFintrackE2eData, disconnectFintrackE2eDb } from "./support/test-data";

export default async function globalSetup() {
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"], {
    env: process.env,
    stdio: "inherit",
  });

  await cleanupFintrackE2eData();
  await disconnectFintrackE2eDb();
}
