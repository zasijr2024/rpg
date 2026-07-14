import { SOURCE_BASELINE_COMMIT } from "../content/original/manifest/canonicalManifest";
import { ManualClock } from "./clock";
import { CommandBus, type Command } from "./commands/CommandBus";
import {
  CooldownManager,
  type CooldownEntrySnapshot,
} from "./cooldowns/CooldownManager";
import { EventBus } from "./events/EventBus";
import {
  NotificationCenter,
  type NotificationCenterSnapshot,
} from "./notifications/NotificationCenter";
import {
  createDefaultRng,
  isRngLifecycleSnapshot,
  isSerializableRng,
  restoreRng,
  type Rng,
  type RngLifecycleSnapshot,
} from "./rng";
import type { DevSaveAdapter, DevSaveData } from "./save/devSave";
import {
  isNonNegativeNumber,
  isRecord,
  isSemanticallyValidGameState,
} from "./save/validation";
import { StateStore } from "./state/StateStore";
import { createInitialState, type GameState } from "./state/types";
import type {
  WorldEncounterContext,
  WorldMoveDirection,
} from "./world/WorldRuntime";
import type { SpaceMoveDirection } from "./space/SpaceRuntime";

export interface GameEngineSnapshot {
  sourceCommit: string;
  saveScope: string;
  rngKind: string;
  nowMs: number;
}

export interface GameEngineOptions {
  rng?: Rng;
  rngSeed?: number;
  clock?: ManualClock;
  state?: StateStore;
  saveAdapter?: DevSaveAdapter;
}

export interface GameEngineDevSnapshot {
  kind: "engine";
  version: 2;
  state: GameState;
  nowMs: number;
  rng: RngLifecycleSnapshot;
  cooldowns: CooldownEntrySnapshot[];
  notifications: NotificationCenterSnapshot;
}

export type GameCommand =
  | Command<"notify", { source: string; message: string }>
  | Command<"cooldown.start", { key: string; durationMs: number }>
  | Command<"room.lightFire", Record<string, never>>
  | Command<"room.stokeFire", Record<string, never>>
  | Command<"room.build", { key: string }>
  | Command<"room.buy", { key: string }>
  | Command<"outside.gatherWood", Record<string, never>>
  | Command<"outside.checkTraps", Record<string, never>>
  | Command<"outside.increaseWorker", { worker: string; amount: number }>
  | Command<"outside.decreaseWorker", { worker: string; amount: number }>
  | Command<"path.increaseSupply", { key: string; amount: number }>
  | Command<"path.decreaseSupply", { key: string; amount: number }>
  | Command<"path.embark", Record<string, never>>
  | Command<"world.move", { direction: WorldMoveDirection }>
  | Command<"world.enterLandmark", Record<string, never>>
  | Command<"world.returnHome", Record<string, never>>
  | Command<"ship.reinforceHull", Record<string, never>>
  | Command<"ship.upgradeEngine", Record<string, never>>
  | Command<"ship.requestLiftOff", Record<string, never>>
  | Command<"ship.confirmLiftOff", Record<string, never>>
  | Command<"ship.linger", Record<string, never>>
  | Command<"space.move", { direction: SpaceMoveDirection }>
  | Command<
      "space.setMovement",
      { direction: SpaceMoveDirection; active: boolean }
    >
  | Command<"space.continueEnding", Record<string, never>>
  | Command<"fabricator.fabricate", { key: string }>
  | Command<"event.triggerAvailable", Record<string, never>>
  | Command<"event.triggerWorldEncounter", WorldEncounterContext>
  | Command<"event.triggerWorldSetpiece", { scene: string }>
  | Command<"event.choose", { key: string }>
  | Command<"event.combatAction", { key: string }>
  | Command<"event.lootAction", { key: string }>;

export interface GameEvents {
  notification: ReturnType<NotificationCenter["notify"]>;
  command: GameCommand;
}

export class GameEngine {
  rng: Rng;
  readonly clock: ManualClock;
  state: StateStore;
  readonly commands = new CommandBus<GameCommand>();
  readonly events = new EventBus<GameEvents>();
  readonly notifications: NotificationCenter;
  readonly cooldowns: CooldownManager;
  private readonly saveAdapter?: DevSaveAdapter;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? createDefaultRng(options.rngSeed);
    this.clock = options.clock ?? new ManualClock();
    this.state = options.state ?? new StateStore(createInitialState());
    this.saveAdapter = options.saveAdapter;
    this.notifications = new NotificationCenter(() => this.clock.now());
    this.cooldowns = new CooldownManager(this.clock);
    this.registerCoreCommands();
  }

  getSnapshot(): GameEngineSnapshot {
    return {
      sourceCommit: SOURCE_BASELINE_COMMIT,
      saveScope: "versioned autosave with backup recovery",
      rngKind: isSerializableRng(this.rng) ? "mulberry32" : "injected",
      nowMs: this.clock.now(),
    };
  }

  createDevSnapshot(): GameEngineDevSnapshot {
    if (!isSerializableRng(this.rng)) {
      throw new Error("Dev snapshots require a serializable RNG");
    }
    return {
      kind: "engine",
      version: 2,
      state: this.state.snapshot(),
      nowMs: this.clock.now(),
      rng: this.rng.lifecycleSnapshot(),
      cooldowns: this.cooldowns.lifecycleSnapshot(),
      notifications: this.notifications.snapshot(),
    };
  }

  restoreDevSnapshot(data: DevSaveData): boolean {
    if (isEngineDevSnapshot(data)) {
      const previous = this.createDevSnapshot();
      try {
        this.applyEngineSnapshot(data);
        return true;
      } catch {
        this.applyEngineSnapshot(previous);
        return false;
      }
    }

    if (isLegacyGameState(data)) {
      this.state = new StateStore(data);
      this.clock.clearAll();
      this.cooldowns.restore([]);
      this.notifications.clear();
      return true;
    }

    return false;
  }

  saveDevSnapshot(data: DevSaveData): void {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    this.saveAdapter.save(data);
  }

  loadDevSnapshot(): DevSaveData | null {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    return this.saveAdapter.load();
  }

  saveDevState(): void {
    this.saveDevSnapshot(this.createDevSnapshot());
  }

  loadDevState(): boolean {
    const loaded = this.loadDevSnapshot();
    if (!loaded) return false;
    if (this.restoreDevSnapshot(loaded)) return true;
    const recovered = this.recoverDevSnapshot("invalid-engine-snapshot");
    if (recovered && this.restoreDevSnapshot(recovered)) return true;
    if (recovered) this.quarantineDevState("invalid-engine-backup-snapshot");
    return false;
  }

  recoverDevSnapshot(reason: string): DevSaveData | null {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    return this.saveAdapter.recover(reason);
  }

  clearDevState(): void {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    this.saveAdapter.clear();
  }

  quarantineDevState(reason: string): void {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    this.saveAdapter.quarantine(reason);
  }

  hasDevSaveAdapter(): boolean {
    return this.saveAdapter !== undefined;
  }

  private applyEngineSnapshot(data: GameEngineDevSnapshot): void {
    // RNG must be authoritative before any clock or runtime lifecycle can
    // schedule work that consumes randomness.
    this.rng = restoreRng(data.rng);
    this.clock.restoreNow(data.nowMs);
    this.state = new StateStore(structuredClone(data.state));
    this.cooldowns.restore(data.cooldowns);
    this.notifications.restore(data.notifications);
  }

  private registerCoreCommands(): void {
    this.commands.register("notify", (command) => {
      const notification = this.notifications.notify(
        command.payload.source,
        command.payload.message,
      );
      this.events.publish("notification", notification);
      this.events.publish("command", command);
    });

    this.commands.register("cooldown.start", (command) => {
      this.cooldowns.start(command.payload.key, command.payload.durationMs);
      this.events.publish("command", command);
    });
  }
}

export function createGameEngine(options?: GameEngineOptions): GameEngine {
  return new GameEngine(options);
}

export function isEngineDevSnapshot(
  data: DevSaveData,
): data is GameEngineDevSnapshot {
  return (
    isRecord(data) &&
    data.kind === "engine" &&
    data.version === 2 &&
    isNonNegativeNumber(data.nowMs) &&
    isRngLifecycleSnapshot(data.rng) &&
    isLegacyGameState(data.state) &&
    isCooldownEntries(data.cooldowns, data.nowMs) &&
    isNotificationSnapshot(data.notifications, data.nowMs)
  );
}

function isLegacyGameState(data: DevSaveData): data is GameState {
  return isSemanticallyValidGameState(data);
}

function isCooldownEntries(
  value: unknown,
  nowMs: number,
): value is CooldownEntrySnapshot[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.key !== "string" ||
      entry.key.length === 0 ||
      keys.has(entry.key) ||
      !isNonNegativeNumber(entry.startedAt) ||
      entry.startedAt > nowMs ||
      !isNonNegativeNumber(entry.durationMs) ||
      entry.durationMs <= 0 ||
      entry.durationMs > Number.MAX_SAFE_INTEGER
    ) {
      return false;
    }
    keys.add(entry.key);
    return true;
  });
}

function isNotificationSnapshot(
  value: unknown,
  nowMs: number,
): value is NotificationCenterSnapshot {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.nextId) ||
    (value.nextId as number) < 1 ||
    !Array.isArray(value.items)
  ) {
    return false;
  }
  const nextId = value.nextId as number;
  const ids = new Set<number>();
  return value.items.every((item) => {
    const id = isRecord(item) ? item.id : undefined;
    if (
      !isRecord(item) ||
      !Number.isSafeInteger(id) ||
      (id as number) < 1 ||
      (id as number) >= nextId ||
      ids.has(id as number) ||
      typeof item.source !== "string" ||
      typeof item.message !== "string" ||
      !isNonNegativeNumber(item.createdAt) ||
      item.createdAt > nowMs
    ) {
      return false;
    }
    ids.add(id as number);
    return true;
  });
}
