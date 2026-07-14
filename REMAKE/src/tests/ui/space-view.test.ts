import { describe, expect, it } from "vitest";
import type { SpaceStateSnapshot } from "../../engine";
import { describeSpatialFlight } from "../../ui/SpaceSpatialFeed";
import { spaceFlightColors } from "../../ui/SpaceView";

describe("SpaceView flight colors", () => {
  it("keeps essential ship and debris glyphs above WCAG text contrast throughout ascent", () => {
    for (let altitude = 0; altitude <= 60; altitude += 1) {
      const { background, foreground } = spaceFlightColors(altitude);
      expect(
        contrastRatio(foreground, background),
        `altitude ${altitude}: foreground ${foreground}, background ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("SpaceView nonvisual spatial model", () => {
  it("reports ship coordinates and an honest empty-flight state", () => {
    const description = describeSpatialFlight(spaceSnapshot());

    expect(description).toMatchObject({
      shipPosition:
        "altitude 0; ship position: center column, center row; x 350, y 350.",
      nearestDebris: "nearest debris: none in the flight area.",
      collisionThreat: "collision threat: clear.",
      threatLevel: "clear",
      escapeDirection: "",
    });
  });

  it("turns collision geometry into a bearing, distance, urgency, and escape action", () => {
    const description = describeSpatialFlight(
      spaceSnapshot({
        asteroids: [{ id: 1, glyph: "O", x: 340, y: 230, speed: 0.2 }],
      }),
    );

    expect(description.nearestDebris).toBe(
      "nearest debris: north, 100 pixels away.",
    );
    expect(description.collisionThreat).toBe(
      "collision threat: imminent; debris in the collision lane 80 pixels north; move west.",
    );
    expect(description.threatLevel).toBe("imminent");
    expect(description.escapeDirection).toBe("west");
    expect(description.announcement).toContain(
      "altitude 0; ship position: center column, center row",
    );
  });

  it("does not label a nearby off-lane obstacle as a collision", () => {
    const description = describeSpatialFlight(
      spaceSnapshot({
        asteroids: [{ id: 2, glyph: "P", x: 500, y: 300, speed: 0.2 }],
      }),
    );

    expect(description.nearestDebris).toBe(
      "nearest debris: east, 160 pixels away.",
    );
    expect(description.collisionThreat).toBe("collision threat: clear.");
  });

  it("uses screen-relative sectors and recommends an available edge escape", () => {
    const description = describeSpatialFlight(
      spaceSnapshot({
        shipX: 10,
        shipY: 690,
        asteroids: [{ id: 3, glyph: "H", x: 0, y: 600, speed: 0.2 }],
      }),
    );

    expect(description.shipPosition).toBe(
      "altitude 0; ship position: west column, south row; x 10, y 690.",
    );
    expect(description.collisionThreat).toContain("move east");
  });
});

function spaceSnapshot(
  overrides: Partial<SpaceStateSnapshot> = {},
): SpaceStateSnapshot {
  return {
    active: true,
    phase: "flying",
    title: "Troposphere",
    altitude: 0,
    hull: 6,
    maxHull: 6,
    shipX: 350,
    shipY: 350,
    asteroids: [],
    score: 0,
    totalScore: 0,
    endingStage: "none",
    ...overrides,
  };
}

function contrastRatio(foreground: number, background: number): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}
