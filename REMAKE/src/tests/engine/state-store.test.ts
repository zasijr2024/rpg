import { describe, expect, it } from "vitest";
import {
  MAX_STORE,
  StateStore,
  createInitialState,
  readBoolean,
  readNumber,
  readNumericRecord,
  readStringUnion,
} from "../../engine";

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
      { category: "game", stateName: 'game.workers["hunter"]' },
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
      cooldown: {},
    });
  });

  it("provides typed state selectors for integration boundaries", () => {
    const state = new StateStore();

    state.set("stores.wood", 12);
    state.set("features.location.path", true);
    state.set("outfit", { wood: 3, broken: "value" });
    state.set("game.world.returnLocation", "path");

    expect(readNumber(state, "stores.wood")).toBe(12);
    expect(readNumber(state, "stores.fur")).toBe(0);
    expect(readBoolean(state, "features.location.path")).toBe(true);
    expect(readNumericRecord(state, "outfit")).toEqual({ wood: 3 });
    expect(
      readStringUnion(state, "game.world.returnLocation", [
        "room",
        "path",
      ] as const),
    ).toBe("path");
    expect(
      readStringUnion(state, "game.world.returnLocation", ["room"] as const),
    ).toBeNull();
  });
});
