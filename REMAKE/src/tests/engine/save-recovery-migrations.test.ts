import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createDevSaveDocument,
  createGameEngine,
  createInitialState,
  DEV_SAVE_BACKUP_KEY,
  DEV_SAVE_KEY,
  DEV_SAVE_QUARANTINE_KEY,
  DEV_SAVE_SCHEMA_VERSION,
  DEV_SAVE_STAGING_KEY,
  GameSession,
  LocalStorageDevSaveAdapter,
  MemoryDevSaveAdapter,
} from "../../engine";

describe("durable save recovery and migrations", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("recovers the previous committed generation after checksum corruption", () => {
    const adapter = new LocalStorageDevSaveAdapter();
    adapter.save({ generation: 1 });
    adapter.save({ generation: 2 });
    const corrupted = JSON.parse(
      window.localStorage.getItem(DEV_SAVE_KEY) ?? "null",
    ) as { payload: { generation: number } };
    corrupted.payload.generation = 99;
    window.localStorage.setItem(DEV_SAVE_KEY, JSON.stringify(corrupted));

    expect(adapter.load()).toEqual({ generation: 1 });
    expect(readPayload(DEV_SAVE_KEY)).toEqual({ generation: 1 });
    expect(window.localStorage.getItem(DEV_SAVE_BACKUP_KEY)).toBeNull();
    expect(readQuarantine()).toMatchObject({ reason: "checksum-mismatch" });
  });

  it("ignores an uncommitted staging generation", () => {
    const adapter = new LocalStorageDevSaveAdapter();
    adapter.save({ generation: "committed" });
    window.localStorage.setItem(
      DEV_SAVE_STAGING_KEY,
      JSON.stringify(createDevSaveDocument({ generation: "partial" })),
    );

    expect(adapter.load()).toEqual({ generation: "committed" });
    expect(window.localStorage.getItem(DEV_SAVE_STAGING_KEY)).toBeNull();
  });

  it("rejects and quarantines a save from an incompatible schema", () => {
    window.localStorage.setItem(
      DEV_SAVE_KEY,
      JSON.stringify({
        kind: "adr-remake-save",
        schemaVersion: DEV_SAVE_SCHEMA_VERSION + 1,
        payload: { generation: "future" },
        checksum: "00000000",
      }),
    );

    expect(new LocalStorageDevSaveAdapter().load()).toBeNull();
    expect(window.localStorage.getItem(DEV_SAVE_KEY)).toBeNull();
    expect(readQuarantine()).toMatchObject({ reason: "incompatible-schema" });
  });

  it.each([
    ["session snapshot", { kind: "session", version: 2, marker: "session" }],
    ["engine snapshot", { kind: "engine", version: 2, marker: "engine" }],
    ["state snapshot", { ...createInitialState(), stores: { wood: 12 } }],
  ])("migrates an unversioned %s into schema 1", (_label, legacy) => {
    const adapter = new MemoryDevSaveAdapter();
    adapter.setRawForTest(JSON.stringify(legacy));

    expect(adapter.load()).toEqual(legacy);
    expect(JSON.parse(adapter.rawForTest() ?? "null")).toMatchObject({
      kind: "adr-remake-save",
      schemaVersion: DEV_SAVE_SCHEMA_VERSION,
      payload: legacy,
    });
  });

  it("uses the backup when a current session payload fails validation", () => {
    const adapter = new MemoryDevSaveAdapter();
    const source = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    source.setStateForTest("stores.wood", 11);
    source.saveDevState();
    source.setStateForTest("stores.wood", 22);
    source.saveDevState();

    const invalid = adapter.load() as {
      engine: { cooldowns: unknown };
    };
    invalid.engine.cooldowns = [{ key: "broken", durationMs: -1 }];
    adapter.setRawForTest(JSON.stringify(invalid));

    const target = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x87654321 }),
    );
    expect(target.loadDevState()).toBe(true);
    expect(target.engine.state.get("stores.wood")).toBe(11);
    expect(adapter.backupForTest()).toBeNull();
    expect(adapter.quarantinedForTest()?.reason).toBe(
      "invalid-session-snapshot",
    );
  });

  it("consumes an invalid backup instead of retrying it on every load", () => {
    const adapter = new MemoryDevSaveAdapter();
    adapter.save({ kind: "session", version: 2, marker: "bad-backup" });
    adapter.save({ kind: "session", version: 2, marker: "bad-primary" });
    const target = new GameSession(
      createGameEngine({ saveAdapter: adapter, rngSeed: 0x12345678 }),
    );
    target.setStateForTest("stores.wood", 7);

    expect(target.loadDevState()).toBe(false);
    expect(target.engine.state.get("stores.wood")).toBe(7);
    expect(adapter.load()).toBeNull();
    expect(adapter.backupForTest()).toBeNull();
    expect(adapter.quarantinedForTest()?.reason).toBe(
      "invalid-session-backup-snapshot",
    );
  });

  it("clears the primary, staging, and backup generations together", () => {
    const adapter = new LocalStorageDevSaveAdapter();
    adapter.save({ generation: 1 });
    adapter.save({ generation: 2 });
    window.localStorage.setItem(DEV_SAVE_STAGING_KEY, "partial");

    adapter.clear();

    expect(window.localStorage.getItem(DEV_SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(DEV_SAVE_STAGING_KEY)).toBeNull();
    expect(window.localStorage.getItem(DEV_SAVE_BACKUP_KEY)).toBeNull();
  });
});

function readPayload(key: string): unknown {
  const value = JSON.parse(window.localStorage.getItem(key) ?? "null") as {
    payload?: unknown;
  } | null;
  return value?.payload;
}

function readQuarantine(): { reason?: string } | null {
  return JSON.parse(
    window.localStorage.getItem(DEV_SAVE_QUARANTINE_KEY) ?? "null",
  ) as { reason?: string } | null;
}

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
