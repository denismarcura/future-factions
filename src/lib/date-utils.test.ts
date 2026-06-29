import { describe, it, expect } from "vitest";
import { getDefaultChallengeDeadline } from "./date-utils";

describe("getDefaultChallengeDeadline", () => {
  it("falls back to a future deadline when there are no upcoming matches", () => {
    const now = new Date("2026-06-26T12:00:00-03:00");
    const deadline = getDefaultChallengeDeadline([], now);
    const deadlineMs = new Date(deadline).getTime();

    expect(deadlineMs).toBeGreaterThan(now.getTime());
    expect(deadlineMs - now.getTime()).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000);
  });
});
