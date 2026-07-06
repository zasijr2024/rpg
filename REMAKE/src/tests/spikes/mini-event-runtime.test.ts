import { describe, expect, it } from "vitest";
import { StateStore, type Rng } from "../../engine";
import {
  createMiniEventFixture,
  MiniEventRuntime
} from "../../spikes/events/miniEventRuntime";

function fixedRng(value: number): Rng {
  return {
    next: () => value,
    nextInt: (maxExclusive) => Math.floor(value * maxExclusive),
    fork: () => fixedRng(value)
  };
}

describe("mini event runtime spike", () => {
  it("applies costs and rewards exactly once", () => {
    const state = new StateStore();
    state.set("stores.wood", 3);

    const runtime = new MiniEventRuntime(
      createMiniEventFixture(),
      state,
      fixedRng(0.25)
    );
    const result = runtime.choose("search");

    expect(result.scene).toBe("quiet");
    expect(state.get("stores.wood")).toBe(2);
    expect(state.get("stores.fur")).toBe(2);
  });

  it("uses deterministic RNG for branch selection", () => {
    const state = new StateStore();
    state.set("stores.wood", 1);

    const runtime = new MiniEventRuntime(
      createMiniEventFixture(),
      state,
      fixedRng(0.75)
    );

    expect(runtime.choose("search").scene).toBe("noise");
  });
});

