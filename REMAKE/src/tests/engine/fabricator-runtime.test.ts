import { describe, expect, it } from "vitest";
import {
  createGameEngine,
  FABRICATOR_ARRIVAL_NOTIFICATION,
  FabricatorRuntime,
  GameSession,
  MemoryDevSaveAdapter,
} from "../../engine";

describe("FabricatorRuntime", () => {
  it("stays unavailable until the Executioner discovery has been committed", () => {
    const engine = createGameEngine({ rngSeed: 1 });
    const fabricator = new FabricatorRuntime(engine);

    expect(fabricator.snapshot()).toMatchObject({
      unlocked: false,
      blueprints: [],
      craftables: [],
      stores: [],
    });
    expect(fabricator.fabricate("energy blade")).toBe(false);
  });

  it("announces the first arrival exactly once", () => {
    const engine = createGameEngine({ rngSeed: 2 });
    const fabricator = new FabricatorRuntime(engine);
    engine.state.set("features.location.fabricator", true);

    fabricator.onArrival();
    fabricator.onArrival();

    expect(engine.state.get("game.fabricator.seen")).toBe(true);
    expect(
      engine.notifications.list("fabricator").map(({ message }) => message),
    ).toEqual([FABRICATOR_ARRIVAL_NOTIFICATION]);
  });

  it("keeps gated recipes hidden until their redeemed blueprint exists", () => {
    const engine = createGameEngine({ rngSeed: 3 });
    const fabricator = new FabricatorRuntime(engine);
    engine.state.set("features.location.fabricator", true);

    expect(fabricator.snapshot().craftables.map(({ key }) => key)).toEqual([
      "energy blade",
      "fluid recycler",
      "cargo drone",
    ]);
    expect(fabricator.fabricate("hypo")).toBe(false);

    engine.state.set('character.blueprints["hypo"]', true);
    expect(fabricator.snapshot()).toMatchObject({
      blueprints: ["hypo"],
      craftables: expect.arrayContaining([
        expect.objectContaining({
          key: "hypo",
          quantity: 5,
          blueprintRequired: true,
        }),
      ]),
    });
  });

  it("spends exact costs and applies original fabrication quantities", () => {
    const engine = createGameEngine({ rngSeed: 4 });
    const fabricator = new FabricatorRuntime(engine);
    engine.state.set("features.location.fabricator", true);
    engine.state.set('character.blueprints["hypo"]', true);
    engine.state.set('stores["alien alloy"]', 1);

    expect(fabricator.fabricate("hypo")).toBe(true);
    expect(engine.state.get('stores["alien alloy"]')).toBe(0);
    expect(engine.state.get('stores["hypo"]')).toBe(5);
    expect(fabricator.snapshot().stores).toContainEqual({
      key: "hypo",
      value: 5,
    });
    expect(engine.notifications.list("fabricator").at(-1)?.message).toBe(
      "a handful of hypos. life in a vial.",
    );
  });

  it("rejects unaffordable and maximum-capped operations without mutation", () => {
    const engine = createGameEngine({ rngSeed: 5 });
    const fabricator = new FabricatorRuntime(engine);
    engine.state.set("features.location.fabricator", true);
    engine.state.set('stores["alien alloy"]', 2);
    engine.state.set('stores["fluid recycler"]', 1);

    expect(fabricator.fabricate("fluid recycler")).toBe(false);
    expect(engine.state.get('stores["alien alloy"]')).toBe(2);
    expect(engine.state.get('stores["fluid recycler"]')).toBe(1);

    engine.state.set('stores["alien alloy"]', 0);
    expect(fabricator.fabricate("energy blade")).toBe(false);
    expect(engine.state.get('stores["energy blade"]')).toBeUndefined();
    expect(engine.notifications.list("fabricator").at(-1)?.message).toBe(
      "not enough alien alloy",
    );
  });
});

describe("GameSession Fabricator integration", () => {
  it("guards navigation and exposes Fabricator as its own UI domain", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 6 }));

    session.setLocation("fabricator");
    expect(session.snapshot().location).toBe("room");

    session.setStateForTest("features.location.fabricator", true);
    session.setStateForTest('character.blueprints["stim"]', true);
    session.setStateForTest('stores["alien alloy"]', 1);
    expect(session.uiSnapshot("navigation").fabricator).toEqual({
      unlocked: true,
      title: "A Whirring Fabricator",
    });

    session.setLocation("fabricator");
    session.fabricate("stim");
    expect(session.snapshot()).toMatchObject({
      location: "fabricator",
      fabricator: { stores: [{ key: "stim", value: 1 }] },
    });
  });

  it("round-trips Fabricator location, blueprints, and items through save", () => {
    const adapter = new MemoryDevSaveAdapter();
    const first = new GameSession(
      createGameEngine({ rngSeed: 7, saveAdapter: adapter }),
    );
    first.setStateForTest("features.location.fabricator", true);
    first.setStateForTest('character.blueprints["glowstone"]', true);
    first.setStateForTest('stores["alien alloy"]', 1);
    first.setLocation("fabricator");
    first.fabricate("glowstone");
    first.saveDevState();

    const restored = new GameSession(
      createGameEngine({ rngSeed: 8, saveAdapter: adapter }),
    );
    expect(restored.loadDevState()).toBe(true);
    expect(restored.snapshot()).toMatchObject({
      location: "fabricator",
      fabricator: {
        unlocked: true,
        blueprints: ["glow stone"],
        stores: [{ key: "glowstone", value: 1 }],
      },
    });
  });
});
