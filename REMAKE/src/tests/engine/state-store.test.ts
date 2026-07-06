import { describe, expect, it } from "vitest";
import { MAX_STORE, StateStore, createInitialState } from "../../engine";

describe("StateStore", () => {
  it("supports dot and bracket paths", () => {
    const state = new StateStore();

    state.set('stores["alien alloy"]', 3);
    state.add('stores["alien alloy"]', 2);

    expect(state.get('stores["alien alloy"]')).toBe(5);
  });

  it("returns zero fallback for missing paths when requested", () => {
    const state = new StateStore();

    expect(state.get("stores.wood", true)).toBe(0);
    expect(state.get("stores.wood")).toBeUndefined();
  });

  it("emits state update objects", () => {
    const state = new StateStore();
    const updates: unknown[] = [];
    state.subscribe((update) => updates.push(update));

    state.set("stores.wood", 10);
    state.set('game.workers["hunter"]', 1);

    expect(updates).toEqual([
      { category: "stores", stateName: "stores.wood" },
      { category: "game", stateName: 'game.workers["hunter"]' }
    ]);
  });

  it("clamps store additions and sets through dot and bracket paths", () => {
    const state = new StateStore();

    state.add("stores.wood", 5);
    state.add("stores.wood", -50);
    state.set('stores["alien alloy"]', -1);
    state.set('stores["steel"]', MAX_STORE + 1);

    expect(state.get("stores.wood")).toBe(0);
    expect(state.get('stores["alien alloy"]')).toBe(0);
    expect(state.get('stores["steel"]')).toBe(MAX_STORE);
  });

  it("initializes all original state categories needed by the remake", () => {
    expect(createInitialState()).toMatchObject({
      features: {},
      stores: {},
      character: {},
      income: {},
      timers: {},
      game: {},
      playStats: {},
      previous: {},
      outfit: {},
      config: {},
      wait: {},
      cooldown: {}
    });
  });
});
