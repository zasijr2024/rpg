import { describe, expect, it } from "vitest";
import {
  worldConditionLabels,
  worldKeyDirection,
  worldMapClickDirection,
  worldMapSwipeDirection,
} from "../../ui/WorldView";

const rect = {
  left: 100,
  top: 200,
  width: 610,
  height: 610,
};

describe("WorldView map click movement", () => {
  it("uses the original diagonal map-click quadrants", () => {
    const base = {
      rect,
      mapX: 30,
      mapY: 30,
      columns: 61,
      rows: 61,
    };

    expect(worldMapClickDirection({ ...base, clickX: 405, clickY: 250 })).toBe(
      "north",
    );
    expect(worldMapClickDirection({ ...base, clickX: 405, clickY: 760 })).toBe(
      "south",
    );
    expect(worldMapClickDirection({ ...base, clickX: 150, clickY: 505 })).toBe(
      "west",
    );
    expect(worldMapClickDirection({ ...base, clickX: 660, clickY: 505 })).toBe(
      "east",
    );
  });

  it("ignores exact diagonal boundaries like the original click handler", () => {
    expect(
      worldMapClickDirection({
        rect,
        clickX: 455,
        clickY: 555,
        mapX: 30,
        mapY: 30,
        columns: 61,
        rows: 61,
      }),
    ).toBeNull();
  });
});

describe("WorldView map swipe movement", () => {
  it("maps dominant swipe directions to original World movement", () => {
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 20, y: 105 },
      }),
    ).toBe("west");
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 180, y: 95 },
      }),
    ).toBe("east");
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 104, y: 20 },
      }),
    ).toBe("north");
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 96, y: 180 },
      }),
    ).toBe("south");
  });

  it("ignores short or exactly diagonal swipes", () => {
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 120, y: 100 },
      }),
    ).toBeNull();
    expect(
      worldMapSwipeDirection({
        start: { x: 100, y: 100 },
        end: { x: 150, y: 150 },
      }),
    ).toBeNull();
  });
});

describe("WorldView keyboard movement", () => {
  it("maps arrow keys and WASD to original World movement", () => {
    expect(worldKeyDirection("ArrowUp")).toBe("north");
    expect(worldKeyDirection("w")).toBe("north");
    expect(worldKeyDirection("W")).toBe("north");
    expect(worldKeyDirection("ArrowDown")).toBe("south");
    expect(worldKeyDirection("s")).toBe("south");
    expect(worldKeyDirection("S")).toBe("south");
    expect(worldKeyDirection("ArrowLeft")).toBe("west");
    expect(worldKeyDirection("a")).toBe("west");
    expect(worldKeyDirection("A")).toBe("west");
    expect(worldKeyDirection("ArrowRight")).toBe("east");
    expect(worldKeyDirection("d")).toBe("east");
    expect(worldKeyDirection("D")).toBe("east");
  });

  it("ignores non-movement keys", () => {
    expect(worldKeyDirection("Enter")).toBeNull();
    expect(worldKeyDirection("Escape")).toBeNull();
  });
});

describe("WorldView condition labels", () => {
  it("keeps original World condition order for the status row", () => {
    expect(
      worldConditionLabels({ danger: true, starvation: true, thirst: true }),
    ).toEqual(["danger", "starvation", "thirst"]);
    expect(
      worldConditionLabels({ danger: false, starvation: true, thirst: false }),
    ).toEqual(["starvation"]);
    expect(
      worldConditionLabels({ danger: false, starvation: false, thirst: false }),
    ).toEqual([]);
  });
});
