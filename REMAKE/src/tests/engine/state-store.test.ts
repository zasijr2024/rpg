import { describe, expect, it } from "vitest";
import { StateStore } from "../../engine";

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

    expect(updates).toEqual([{ category: "stores", stateName: "wood" }]);
  });

  it("clamps store additions to non-negative values", () => {
    const state = new StateStore();

    state.add("stores.wood", 5);
    state.add("stores.wood", -50);

    expect(state.get("stores.wood")).toBe(0);
  });
});

