import { describe, expect, it } from "vitest";
import { CooldownManager, ManualClock } from "../../engine";

describe("CooldownManager", () => {
  it("returns renderable progress and remaining time", () => {
    const clock = new ManualClock();
    const cooldowns = new CooldownManager(clock);

    cooldowns.start("stoke", 1000);
    clock.advanceBy(250);

    const snapshot = cooldowns.snapshot("stoke");
    expect(snapshot.active).toBe(true);
    expect(snapshot.remainingMs).toBe(750);
    expect(snapshot.progress).toBe(0.25);
  });

  it("expires completed cooldowns", () => {
    const clock = new ManualClock();
    const cooldowns = new CooldownManager(clock);

    cooldowns.start("stoke", 1000);
    clock.advanceBy(1000);

    expect(cooldowns.snapshot("stoke").active).toBe(false);
    expect(cooldowns.snapshots()).toEqual([]);
    expect(cooldowns.snapshot("stoke").active).toBe(false);
    cooldowns.expireCompleted();
    expect(cooldowns.snapshot("stoke").active).toBe(false);
  });
});
