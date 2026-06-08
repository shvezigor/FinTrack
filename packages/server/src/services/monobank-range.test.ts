import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  MONO_STATEMENT_MAX_SECONDS,
  assertMonobankStatementWindow,
  normalizeMonobankStatementRange,
  parseStatementDate,
  splitMonobankStatementRange,
} from "./monobank-range.js";

describe("monobank statement ranges", () => {
  test("normalizes string, seconds and milliseconds dates", () => {
    const iso = parseStatementDate("2026-05-01T00:00:00.000Z", "from");
    const seconds = parseStatementDate(1_777_593_600, "from");
    const milliseconds = parseStatementDate(1_777_593_600_000, "from");

    assert.equal(iso.toISOString(), "2026-05-01T00:00:00.000Z");
    assert.equal(seconds.toISOString(), "2026-05-01T00:00:00.000Z");
    assert.equal(milliseconds.toISOString(), "2026-05-01T00:00:00.000Z");
  });

  test("normalizes range and rejects inverted or too-long windows", () => {
    const range = normalizeMonobankStatementRange({
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:00:00.000Z",
    });

    assert.equal(range.fromUnix, Math.floor(Date.parse("2026-05-01T00:00:00.000Z") / 1000));
    assert.equal(range.toUnix, Math.floor(Date.parse("2026-05-31T23:00:00.000Z") / 1000));
    assert.doesNotThrow(() => assertMonobankStatementWindow(range));
    assert.throws(
      () => normalizeMonobankStatementRange({ from: "2026-05-02T00:00:00.000Z", to: "2026-05-01T00:00:00.000Z" }),
      /Invalid Monobank sync period/u,
    );
    assert.throws(
      () =>
        assertMonobankStatementWindow({
          days: 40,
          fromDate: new Date(0),
          fromUnix: 0,
          toDate: new Date((MONO_STATEMENT_MAX_SECONDS + 1) * 1000),
          toUnix: MONO_STATEMENT_MAX_SECONDS + 1,
        }),
      /allows up to 31 days/u,
    );
  });

  test("splits long queued import ranges into Monobank-sized chunks", () => {
    const chunks = splitMonobankStatementRange({
      days: 62,
      fromDate: new Date(0),
      fromUnix: 0,
      toDate: new Date((MONO_STATEMENT_MAX_SECONDS * 2 + 100) * 1000),
      toUnix: MONO_STATEMENT_MAX_SECONDS * 2 + 100,
    });

    assert.equal(chunks.length, 3);
    assert.deepEqual(chunks[0], { fromUnix: 0, toUnix: MONO_STATEMENT_MAX_SECONDS });
    assert.deepEqual(chunks[1], { fromUnix: MONO_STATEMENT_MAX_SECONDS + 1, toUnix: MONO_STATEMENT_MAX_SECONDS * 2 + 1 });
    assert.deepEqual(chunks[2], { fromUnix: MONO_STATEMENT_MAX_SECONDS * 2 + 2, toUnix: MONO_STATEMENT_MAX_SECONDS * 2 + 100 });
  });
});
