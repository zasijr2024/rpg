import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_TIME_POLICY_NOTIFICATION,
  createDevSaveDocument,
  createGameEngine,
  DEV_SAVE_KEY,
  DEV_SAVE_QUARANTINE_KEY,
  DEV_SAVE_STAGING_KEY,
  GameSession,
  LocalStorageDevSaveAdapter,
  MemoryDevSaveAdapter,
} from "../../engine";

describe("atomic save foundation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("quarantines corrupt JSON instead of throwing during load", () => {
    window.localStorage.setItem(DEV_SAVE_KEY, "{not-json");
    const adapter = new LocalStorageDevSaveAdapter();

    expect(adapter.load()).toBeNull();
    expect(window.localStorage.getItem(DEV_SAVE_KEY)).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(DEV_SAVE_QUARANTINE_KEY) ?? "null",
      ),
    ).toEqual({ reason: "invalid-json", raw: "{not-json" });
  });

  it("starts a fresh session when browser storage reads are unavailable", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("storage blocked", "SecurityError");
    });
    const session = new GameSession(
      createGameEngine({ saveAdapter: new LocalStorageDevSaveAdapter() }),
    );

    expect(session.loadDevState()).toBe(false);
    expect(session.snapshot().room.title).toBe("A Dark Room");
    expect(session.snapshot().persistence).toMatchObject({
      status: "unavailable",
      operation: "read",
      reason: "storage-blocked",
      hasInMemorySnapshot: true,
      canRetry: true,
      canExport: true,
    });
  });

  it("retains a quota-blocked write in memory and retries it for a reload", () => {
    const originalSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    let writesBlocked = true;
    vi.spyOn(window.localStorage, "setItem").mockImplementation(
      (key, value) => {
        if (writesBlocked) {
          throw new DOMException(
            "storage quota unavailable",
            "QuotaExceededError",
          );
        }
        originalSetItem(key, value);
      },
    );
    const session = new GameSession(
      createGameEngine({
        saveAdapter: new LocalStorageDevSaveAdapter(),
        rngSeed: 0x12345678,
      }),
    );
    session.setStateForTest("stores.wood", 91);

    expect(session.saveDevState()).toBe(false);
    expect(session.snapshot().persistence).toMatchObject({
      status: "unavailable",
      operation: "write",
      reason: "quota-exceeded",
      hasInMemorySnapshot: true,
    });
    expect(
      JSON.parse(session.exportRecoverySnapshot() ?? "null"),
    ).toMatchObject({
      payload: { engine: { state: { stores: { wood: 91 } } } },
    });

    writesBlocked = false;
    expect(session.retryPersistence()).toBe(true);
    expect(session.snapshot().persistence.status).toBe("healthy");

    const reloaded = new GameSession(
      createGameEngine({
        saveAdapter: new LocalStorageDevSaveAdapter(),
        rngSeed: 0x87654321,
      }),
    );
    expect(reloaded.loadDevState()).toBe(true);
    expect(reloaded.getStateForTest("stores.wood")).toBe(91);
  });

  it("surfaces private-mode write restrictions without stopping play", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("private storage blocked", "SecurityError");
    });
    const session = new GameSession(
      createGameEngine({
        saveAdapter: new LocalStorageDevSaveAdapter(),
        rngSeed: 0x12345678,
      }),
    );

    session.lightFire();
    expect(session.saveDevState()).toBe(false);
    expect(session.snapshot().room.title).toBe("A Firelit Room");
    expect(session.snapshot().persistence).toMatchObject({
      status: "unavailable",
      operation: "write",
      reason: "storage-blocked",
    });
  });

  it("keeps the last committed save if the primary write fails", () => {
    const adapter = new LocalStorageDevSaveAdapter();
    adapter.save({ value: "committed" });
    const originalSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    vi.spyOn(window.localStorage, "setItem").mockImplementation(
      (key, value) => {
        if (key === DEV_SAVE_KEY && value.includes("replacement")) {
          throw new Error("simulated interrupted write");
        }
        originalSetItem(key, value);
      },
    );

    expect(() => adapter.save({ value: "replacement" })).toThrow(
      "simulated interrupted write",
    );
    expect(adapter.load()).toEqual({ value: "committed" });
    expect(window.localStorage.getItem(DEV_SAVE_STAGING_KEY)).toBeNull();
  });

  it("rejects and quarantines an invalid session before mutating live state", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    source.setStateForTest("stores.wood", 91);
    source.saveDevState();
    const invalid = adapter.load() as {
      engine: { cooldowns: unknown };
    };
    invalid.engine.cooldowns = [{ key: "broken", durationMs: -1 }];
    adapter.setRawForTest(JSON.stringify(createDevSaveDocument(invalid)));

    const target = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
    );
    target.setStateForTest("stores.wood", 7);

    expect(target.loadDevState()).toBe(false);
    expect(target.engine.state.get("stores.wood")).toBe(7);
    expect(adapter.load()).toBeNull();
    expect(adapter.quarantinedForTest()?.reason).toBe(
      "invalid-session-snapshot",
    );
  });

  it("restores RNG before an event lifecycle schedules resumed work", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x10203040 }),
    );
    source.saveDevState();
    const saved = adapter.load() as {
      events: { eventTimerDueAt: number | null };
    };
    saved.events.eventTimerDueAt = null;
    adapter.save(saved);
    source.engine.rng.next();
    const expectedAfterEventScheduling = source.engine.rng.next();

    const target = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0xfedcba98 }),
    );
    expect(target.loadDevState()).toBe(true);

    expect(target.engine.rng.next()).toBe(expectedAfterEventScheduling);
  });

  it("autosaves a running production session after a player command", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    source.start(() => undefined);
    source.lightFire();
    source.stop();

    const resumed = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
    );
    expect(resumed.loadDevState()).toBe(true);
    expect(resumed.snapshot().room.title).toBe("A Firelit Room");
  });

  it("restores clock debt while the production driver remains running", () => {
    const adapter = new MemoryDevSaveAdapter();
    const session = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    session.start(() => undefined);
    session.setStateForTest("stores.wood", 91);
    session.saveDevState();
    session.setStateForTest("stores.wood", 7);

    expect(session.loadDevState()).toBe(true);
    expect(session.engine.state.get("stores.wood")).toBe(91);
    session.stop();
  });

  it("announces the closed-page time policy once on first resume", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    source.saveDevState();

    const firstResume = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
    );
    expect(firstResume.loadDevState()).toBe(true);
    expect(
      firstResume.uiSnapshot("navigation").backgroundTimePolicyNotice,
    ).toBe(BACKGROUND_TIME_POLICY_NOTIFICATION);
    expect(
      firstResume.engine.notifications
        .list("room")
        .filter(
          ({ message }) => message === BACKGROUND_TIME_POLICY_NOTIFICATION,
        ),
    ).toHaveLength(1);
    firstResume.dismissBackgroundTimePolicyNotice();
    expect(
      firstResume.uiSnapshot("navigation").backgroundTimePolicyNotice,
    ).toBeNull();
    firstResume.saveDevState();

    const secondResume = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x10203040 }),
    );
    expect(secondResume.loadDevState()).toBe(true);
    expect(
      secondResume.uiSnapshot("navigation").backgroundTimePolicyNotice,
    ).toBeNull();
    expect(
      secondResume.engine.notifications
        .list("room")
        .filter(
          ({ message }) => message === BACKGROUND_TIME_POLICY_NOTIFICATION,
        ),
    ).toHaveLength(1);
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}
