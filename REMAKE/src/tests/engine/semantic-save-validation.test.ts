import { describe, expect, it } from "vitest";
import {
  originalCalculateScore,
  originalScoreFactors,
} from "../../content/original";
import { WORLD_RADIUS } from "../../content/original/world/worldData";
import {
  boundedExactScoreTotal,
  createDevSaveDocument,
  createGameEngine,
  createInitialState,
  GameSession,
  isSemanticallyValidGameState,
  MAX_EXACT_SCORE,
  MAX_STORE,
  MemoryDevSaveAdapter,
} from "../../engine";

describe("semantic restored-state validation", () => {
  it("accepts timer-owned Builder income without a worker timeLeft field", () => {
    const state = createInitialState();
    const builderIncome: {
      delay: number;
      stores: { wood: number };
      timeLeft?: number;
    } = { delay: 10, stores: { wood: 2 } };
    state.income.builder = builderIncome;
    expect(isSemanticallyValidGameState(state)).toBe(true);

    builderIncome.timeLeft = -1;
    expect(isSemanticallyValidGameState(state)).toBe(false);
  });

  it("property-checks generated stores and rejects every negative or oversized mutation", () => {
    const keys = ["wood", "fur", "meat", "steel", "alien alloy"];
    for (let seed = 1; seed <= 128; seed += 1) {
      const state = createInitialState();
      state.stores = Object.fromEntries(
        keys.map((key, index) => [
          key,
          (seed * 2_654_435_761 + index * 97) % (MAX_STORE + 1),
        ]),
      );
      expect(isSemanticallyValidGameState(state)).toBe(true);

      const negative = structuredClone(state);
      negative.stores[keys[seed % keys.length]] = -seed;
      expect(isSemanticallyValidGameState(negative)).toBe(false);

      const oversized = structuredClone(state);
      oversized.stores[keys[(seed + 1) % keys.length]] = MAX_STORE + seed;
      expect(isSemanticallyValidGameState(oversized)).toBe(false);
    }
  });

  it("property-checks map dimensions and cell domains", () => {
    const size = WORLD_RADIUS * 2 + 1;
    const valid = createInitialState();
    valid.game.world = {
      map: grid(size, "A"),
      mask: grid(size, false),
    };
    expect(isSemanticallyValidGameState(valid)).toBe(true);

    for (let seed = 0; seed < 48; seed += 1) {
      const malformed = structuredClone(valid);
      const world = malformed.game.world as {
        map: unknown[][];
        mask: unknown[][];
      };
      const column = seed % size;
      const row = (seed * 17) % size;
      if (seed % 3 === 0) world.map[column].pop();
      else if (seed % 3 === 1) world.map[column][row] = seed;
      else world.mask[column][row] = "visible";
      expect(isSemanticallyValidGameState(malformed)).toBe(false);
    }
  });

  it("accepts the Ship compass vector as a village-relative coordinate", () => {
    const size = WORLD_RADIUS * 2 + 1;
    const state = createInitialState();
    state.game.world = {
      map: grid(size, "A"),
      mask: grid(size, false),
      shipPosition: { x: -18, y: 10 },
    };
    expect(isSemanticallyValidGameState(state)).toBe(true);

    (
      state.game.world as { shipPosition: { x: number; y: number } }
    ).shipPosition.x = -WORLD_RADIUS - 1;
    expect(isSemanticallyValidGameState(state)).toBe(false);
  });

  it("property-checks worker allocation against population and hut capacity", () => {
    for (let population = 1; population <= 128; population += 1) {
      const state = createInitialState();
      const hunters = Math.floor(population / 2);
      state.game.population = population;
      state.game.buildings = { hut: Math.ceil(population / 4) };
      state.game.workers = {
        hunter: hunters,
        trapper: population - hunters,
      };
      expect(isSemanticallyValidGameState(state)).toBe(true);

      (state.game.workers as Record<string, number>).trapper += 1;
      expect(isSemanticallyValidGameState(state)).toBe(false);
    }
  });

  it("enforces cross-domain unlock dependencies", () => {
    const ship = createInitialState();
    ship.game.spaceShip = {
      hull: 1,
      thrusters: 1,
      awaitingLiftOffConfirmation: true,
    };
    expect(isSemanticallyValidGameState(ship)).toBe(false);
    ship.features.location = { spaceShip: true };
    expect(isSemanticallyValidGameState(ship)).toBe(true);

    const size = WORLD_RADIUS * 2 + 1;
    const world = createInitialState();
    world.game.world = {
      active: true,
      x: WORLD_RADIUS,
      y: WORLD_RADIUS,
      map: grid(size, "A"),
      mask: grid(size, false),
    };
    world.game.expedition = { baselineWorld: {} };
    expect(isSemanticallyValidGameState(world)).toBe(false);
    world.features.location = { world: true };
    expect(isSemanticallyValidGameState(world)).toBe(true);
  });

  it.each([
    [
      "inactive World location",
      (save: MutableSessionSave) => {
        save.location = "world";
      },
    ],
    [
      "flying lifecycle with no hull or timers",
      (save: MutableSessionSave) => {
        save.location = "space";
        save.engine.state.features.location = { spaceShip: true };
        save.space.phase = "flying";
      },
    ],
    [
      "uninitialized room lifecycle",
      (save: MutableSessionSave) => {
        save.room.initialized = false;
      },
    ],
    [
      "unbounded background time scale",
      (save: MutableSessionSave) => {
        save.clockDriver.debt = [{ elapsedMs: 1, timeScale: 1_000_000 }];
      },
    ],
  ])(
    "rejects the impossible %s before replacing live state",
    (_label, mutate) => {
      const adapter = new MemoryDevSaveAdapter();
      const source = new GameSession(
        createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
      );
      source.saveDevState();
      const malformed = loadData(adapter) as MutableSessionSave;
      mutate(malformed);
      adapter.setRawForTest(JSON.stringify(createDevSaveDocument(malformed)));

      const target = new GameSession(
        createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
      );
      target.setStateForTest("stores.wood", 7);
      expect(target.loadDevState()).toBe(false);
      expect(target.getStateForTest("stores.wood")).toBe(7);
    },
  );

  it("recovers the previous generation when the primary violates store semantics", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    source.setStateForTest("stores.wood", 11);
    source.saveDevState();
    source.setStateForTest("stores.wood", 22);
    source.saveDevState();
    const invalid = loadData(adapter) as MutableSessionSave;
    invalid.engine.state.stores.wood = -1;
    adapter.setRawForTest(JSON.stringify(createDevSaveDocument(invalid)));

    const target = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
    );
    expect(target.loadDevState()).toBe(true);
    expect(target.getStateForTest("stores.wood")).toBe(11);
    expect(target.snapshot().persistence).toMatchObject({
      status: "recovered",
      reason: "invalid-session-snapshot",
    });
  });
});

function loadData(adapter: MemoryDevSaveAdapter): unknown {
  const loaded = adapter.load();
  if (!("data" in loaded))
    throw new Error(`Expected save data: ${loaded.status}`);
  return loaded.data;
}

describe("exact score boundary", () => {
  it("keeps the maximum supported score exact and sensitive to one unit", () => {
    const maximumPrestige = originalScoreFactors.map(() => MAX_STORE);
    const maximum = originalCalculateScore(
      maximumPrestige,
      { "alien alloy": MAX_STORE, "fleet beacon": MAX_STORE },
      MAX_STORE,
    );
    const oneLessWood = [...maximumPrestige];
    oneLessWood[0] -= 1;
    const oneLess = originalCalculateScore(
      oneLessWood,
      { "alien alloy": MAX_STORE, "fleet beacon": MAX_STORE },
      MAX_STORE,
    );

    expect(Number.isSafeInteger(maximum)).toBe(true);
    expect(maximum).toBeLessThanOrEqual(MAX_EXACT_SCORE);
    expect(maximum - oneLess).toBe(1);
  });

  it("saturates cumulative scores without an unsafe addition intermediate", () => {
    expect(boundedExactScoreTotal(MAX_EXACT_SCORE - 5, 4)).toBe(
      MAX_EXACT_SCORE - 1,
    );
    expect(boundedExactScoreTotal(MAX_EXACT_SCORE - 5, 6)).toBe(
      MAX_EXACT_SCORE,
    );
    expect(() => boundedExactScoreTotal(MAX_EXACT_SCORE + 1, 0)).toThrow(
      "Scores must be non-negative safe integers",
    );
  });
});

interface MutableSessionSave {
  location: string;
  engine: {
    state: {
      features: Record<string, unknown>;
      stores: Record<string, number>;
    };
  };
  room: { initialized: boolean };
  space: { phase: string };
  clockDriver: { debt: Array<{ elapsedMs: number; timeScale: number }> };
}

function grid<T>(size: number, value: T): T[][] {
  return Array.from({ length: size }, () => Array(size).fill(value));
}
