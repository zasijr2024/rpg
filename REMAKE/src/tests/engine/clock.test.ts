import { describe, expect, it } from "vitest";
import { ManualClock } from "../../engine";

describe("ManualClock", () => {
  it("runs timeouts only after their delay", () => {
    const clock = new ManualClock();
    let calls = 0;

    clock.setTimeout(() => {
      calls += 1;
    }, 100);

    clock.advanceBy(99);
    expect(calls).toBe(0);
    clock.advanceBy(1);
    expect(calls).toBe(1);
  });

  it("runs intervals repeatedly while advancing time", () => {
    const clock = new ManualClock();
    let calls = 0;

    clock.setInterval(() => {
      calls += 1;
    }, 10);

    clock.advanceBy(35);
    expect(calls).toBe(3);
  });
});

