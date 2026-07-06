import { describe, expect, it } from "vitest";
import { ManualClock, NotificationCenter } from "../../engine";

describe("NotificationCenter", () => {
  it("records timestamped notifications", () => {
    const clock = new ManualClock();
    const notifications = new NotificationCenter(() => clock.now());

    clock.advanceBy(50);
    notifications.notify("room", "the fire is lit");

    expect(notifications.list()).toEqual([
      {
        id: 1,
        source: "room",
        message: "the fire is lit",
        createdAt: 50
      }
    ]);
  });
});

