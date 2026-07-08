import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalContentRegistry,
  originalFabricatorCraftables,
  originalSpaceAsteroidCountForAltitude,
  originalSpaceAsteroidDuration,
  originalSpaceAsteroids,
  originalSpaceAsteroidWaveThresholds,
  originalSpaceBackgroundMusicVolume,
  originalSpaceHitAudioOffset,
  originalSpaceHitAudioTiers,
  originalSpaceKeyBindings,
  originalSpaceNextAsteroidDelay,
  originalSpaceShipSpeed,
  originalSpaceTitleForAltitude,
  originalSpaceTitleThresholds,
  SHIP_ALLOY_PER_HULL,
  SHIP_ALLOY_PER_THRUSTER,
  SHIP_BASE_HULL,
  SHIP_BASE_THRUSTERS,
  SHIP_LIFTOFF_COOLDOWN,
  SPACE_ALTITUDE_TICK_INTERVAL,
  SPACE_ASTEROID_END_TOP,
  SPACE_ASTEROID_SPEED_RANDOM_FACTOR,
  SPACE_BASE_ASTEROID_DELAY,
  SPACE_BASE_ASTEROID_SPEED,
  SPACE_ESCAPE_ALTITUDE,
  SPACE_FADE_TO_BLACK_SPEED,
  SPACE_FRAME_DELAY,
  SPACE_NUM_STARS,
  SPACE_PANEL_SIZE,
  SPACE_SHIP_END_LEFT,
  SPACE_SHIP_END_TOP,
  SPACE_SHIP_EXIT_TOP,
  SPACE_SHIP_MAX_POSITION,
  SPACE_SHIP_MIN_POSITION,
  SPACE_SHIP_SPEED,
  SPACE_SHIP_START_LEFT,
  SPACE_SHIP_START_TOP,
  SPACE_SHIP_TIMER_INTERVAL,
  SPACE_STAR_HEIGHT,
  SPACE_STAR_SPEED,
  SPACE_STAR_WIDTH,
  SPACE_VOLUME_TIMER_INTERVAL,
} from "../../content/original";

describe("original late-game data", () => {
  it("ports exact ship constants", () => {
    expect(SHIP_LIFTOFF_COOLDOWN).toBe(120);
    expect(SHIP_ALLOY_PER_HULL).toBe(1);
    expect(SHIP_ALLOY_PER_THRUSTER).toBe(1);
    expect(SHIP_BASE_HULL).toBe(0);
    expect(SHIP_BASE_THRUSTERS).toBe(1);
  });

  it("ports exact space constants", () => {
    expect(SPACE_SHIP_SPEED).toBe(3);
    expect(SPACE_BASE_ASTEROID_DELAY).toBe(500);
    expect(SPACE_BASE_ASTEROID_SPEED).toBe(1500);
    expect(SPACE_FADE_TO_BLACK_SPEED).toBe(60000);
    expect(SPACE_STAR_WIDTH).toBe(3000);
    expect(SPACE_STAR_HEIGHT).toBe(3000);
    expect(SPACE_NUM_STARS).toBe(200);
    expect(SPACE_STAR_SPEED).toBe(60000);
    expect(SPACE_FRAME_DELAY).toBe(100);
    expect(SPACE_SHIP_TIMER_INTERVAL).toBe(33);
    expect(SPACE_VOLUME_TIMER_INTERVAL).toBe(1000);
    expect(SPACE_ALTITUDE_TICK_INTERVAL).toBe(1000);
    expect(SPACE_ESCAPE_ALTITUDE).toBe(60);
    expect(SPACE_PANEL_SIZE).toBe(700);
    expect(SPACE_ASTEROID_END_TOP).toBe(740);
    expect(SPACE_SHIP_MIN_POSITION).toBe(10);
    expect(SPACE_SHIP_MAX_POSITION).toBe(690);
    expect(SPACE_SHIP_START_TOP).toBe(350);
    expect(SPACE_SHIP_START_LEFT).toBe(350);
    expect(SPACE_SHIP_END_TOP).toBe(350);
    expect(SPACE_SHIP_END_LEFT).toBe(240);
    expect(SPACE_SHIP_EXIT_TOP).toBe(-100);
    expect(SPACE_ASTEROID_SPEED_RANDOM_FACTOR).toBe(0.65);
  });

  it("matches fabricator manifest keys", () => {
    expect(
      originalFabricatorCraftables.map((craftable) => craftable.key),
    ).toEqual(canonicalManifest.keys.fabricatorCraftables);
  });

  it("ports exact fabricator craftables", () => {
    expect(originalFabricatorCraftables).toContainEqual({
      key: "energy blade",
      name: "energy blade",
      type: "weapon",
      buildMsg: "the blade hums, charged particles sparking and fizzing.",
      cost: { "alien alloy": 1 },
    });
    expect(originalFabricatorCraftables).toContainEqual({
      key: "kinetic armour",
      name: "kinetic armour",
      type: "upgrade",
      maximum: 1,
      blueprintRequired: true,
      buildMsg: "wanderer soldiers succeed by subverting the enemy's rage.",
      cost: { "alien alloy": 2 },
    });
    expect(originalFabricatorCraftables).toContainEqual({
      key: "hypo",
      name: "hypo",
      type: "tool",
      blueprintRequired: true,
      buildMsg: "a handful of hypos. life in a vial.",
      cost: { "alien alloy": 1 },
      quantity: 5,
    });
    expect(originalFabricatorCraftables).toContainEqual({
      key: "glowstone",
      name: "glow stone",
      type: "tool",
      blueprintRequired: true,
      buildMsg: "a smooth, perfect sphere. its light is inextinguishable.",
      cost: { "alien alloy": 1 },
    });
  });

  it("ports exact space thresholds and glyph tables", () => {
    expect(originalSpaceTitleThresholds).toEqual([
      { minAltitude: 0, title: "Troposphere" },
      { minAltitude: 10, title: "Stratosphere" },
      { minAltitude: 20, title: "Mesosphere" },
      { minAltitude: 30, title: "Thermosphere" },
      { minAltitude: 45, title: "Exosphere" },
      { minAltitude: 60, title: "Space" },
    ]);
    expect(originalSpaceAsteroids).toEqual([
      { rollUnder: 0.2, glyph: "#" },
      { rollUnder: 0.4, glyph: "$" },
      { rollUnder: 0.6, glyph: "%" },
      { rollUnder: 0.8, glyph: "&" },
      { rollUnder: 1, glyph: "H" },
    ]);
    expect(originalSpaceAsteroidWaveThresholds).toEqual([
      { minAltitudeExclusive: 10, extraAsteroids: 1 },
      { minAltitudeExclusive: 20, extraAsteroids: 2 },
      { minAltitudeExclusive: 40, extraAsteroids: 2 },
    ]);
    expect(originalSpaceHitAudioTiers).toEqual([
      { minAltitudeExclusive: 40, offset: 6 },
      { minAltitudeExclusive: 20, offset: 4 },
      { minAltitudeExclusive: -Infinity, offset: 1 },
    ]);
    expect(originalSpaceKeyBindings).toEqual({
      up: [38, 87],
      down: [40, 83],
      left: [37, 65],
      right: [39, 68],
    });
  });

  it("preserves original space helper formulas", () => {
    expect(originalSpaceShipSpeed(1)).toBe(4);
    expect(originalSpaceShipSpeed(4)).toBe(7);
    expect(originalSpaceAsteroidDuration(0)).toBe(1500);
    expect(originalSpaceAsteroidDuration(0.999)).toBe(526);
    expect(originalSpaceNextAsteroidDelay(0)).toBe(1000);
    expect(originalSpaceNextAsteroidDelay(60)).toBe(400);
    expect(originalSpaceAsteroidCountForAltitude(10)).toBe(1);
    expect(originalSpaceAsteroidCountForAltitude(11)).toBe(2);
    expect(originalSpaceAsteroidCountForAltitude(21)).toBe(4);
    expect(originalSpaceAsteroidCountForAltitude(41)).toBe(6);
    expect(originalSpaceTitleForAltitude(9)).toBe("Troposphere");
    expect(originalSpaceTitleForAltitude(10)).toBe("Stratosphere");
    expect(originalSpaceTitleForAltitude(45)).toBe("Exosphere");
    expect(originalSpaceTitleForAltitude(60)).toBe("Space");
    expect(originalSpaceHitAudioOffset(20)).toBe(1);
    expect(originalSpaceHitAudioOffset(21)).toBe(4);
    expect(originalSpaceHitAudioOffset(41)).toBe(6);
    expect(originalSpaceBackgroundMusicVolume(0)).toBe(1);
    expect(originalSpaceBackgroundMusicVolume(30)).toBe(0.5);
    expect(originalSpaceBackgroundMusicVolume(60)).toBe(0);
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.fabricatorCraftables).toBe(
      originalFabricatorCraftables,
    );
    expect(originalContentRegistry.spaceTitleThresholds).toBe(
      originalSpaceTitleThresholds,
    );
    expect(originalContentRegistry.spaceAsteroids).toBe(originalSpaceAsteroids);
    expect(originalContentRegistry.spaceAsteroidWaveThresholds).toBe(
      originalSpaceAsteroidWaveThresholds,
    );
    expect(originalContentRegistry.spaceHitAudioTiers).toBe(
      originalSpaceHitAudioTiers,
    );
  });
});
