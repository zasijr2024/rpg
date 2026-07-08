import { describe, expect, it } from "vitest";
import { simulateCooldownPressure } from "../../spikes/perf/cooldownPressure";

describe("cooldown pressure spike", () => {
  it("coalesces frame ticks into percent notifications", () => {
    const notifications: number[] = [];

    const result = simulateCooldownPressure(10_000, 16, (percent) => {
      notifications.push(percent);
    });

    expect(result.ticks).toBeGreaterThan(500);
    expect(result.notifications).toBeLessThanOrEqual(101);
    expect(result.distinctPercentValues).toBeLessThanOrEqual(101);
    expect(notifications.at(-1)).toBe(100);
  });
});
