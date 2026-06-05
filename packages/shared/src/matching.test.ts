import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreExpenseMatch } from "./matching.js";

describe("scoreExpenseMatch", () => {
  it("scores exact same-day amount as auto-match candidate", () => {
    const score = scoreExpenseMatch(
      {
        amount: 631,
        categorySlug: "food",
        timestamp: new Date("2026-04-16T19:52:00Z"),
      },
      {
        amount: 631,
        timestamp: new Date("2026-04-16T20:02:00Z"),
      },
    );

    assert.equal(score.score >= 90, true);
  });

  it("penalizes distant dates", () => {
    const score = scoreExpenseMatch(
      {
        amount: 631,
        timestamp: new Date("2026-04-16T19:52:00Z"),
      },
      {
        amount: 631,
        timestamp: new Date("2026-04-22T19:52:00Z"),
      },
    );

    assert.equal(score.score < 90, true);
  });
});
