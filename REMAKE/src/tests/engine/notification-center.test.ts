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
        createdAt: 50,
      },
    ]);
  });

  it("filters by source and retains only the configured history", () => {
    const clock = new ManualClock();
    const notifications = new NotificationCenter(() => clock.now(), 2);

    notifications.notify("room", "first");
    notifications.notify("outside", "second");
    notifications.notify("room", "third");

    expect(
      notifications.list().map((notification) => notification.message),
    ).toEqual(["second", "third"]);
    expect(
      notifications.list("room").map((notification) => notification.message),
    ).toEqual(["third"]);
  });
});
