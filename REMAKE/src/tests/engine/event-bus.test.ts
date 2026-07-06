import { describe, expect, it } from "vitest";
import { EventBus } from "../../engine";

interface TestEvents {
  ping: { value: number };
}

describe("EventBus", () => {
  it("publishes payloads to subscribers", () => {
    const bus = new EventBus<TestEvents>();
    const values: number[] = [];

    bus.subscribe("ping", (payload) => values.push(payload.value));
    bus.publish("ping", { value: 7 });

    expect(values).toEqual([7]);
  });

  it("unsubscribes handlers", () => {
    const bus = new EventBus<TestEvents>();
    const values: number[] = [];
    const unsubscribe = bus.subscribe("ping", (payload) =>
      values.push(payload.value)
    );

    unsubscribe();
    bus.publish("ping", { value: 7 });

    expect(values).toEqual([]);
  });
});

