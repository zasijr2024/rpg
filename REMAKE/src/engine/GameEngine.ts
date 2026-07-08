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
import { createDefaultRng, type Rng } from "./rng";
import type { DevSaveAdapter, DevSaveData } from "./save/devSave";
import { StateStore } from "./state/StateStore";
import { createInitialState, type GameState } from "./state/types";
import type {
  WorldEncounterContext,
  WorldMoveDirection,
} from "./world/WorldRuntime";

export interface GameEngineSnapshot {
  sourceCommit: string;
  saveScope: string;
  rngKind: string;
  nowMs: number;
}

export interface GameEngineOptions {
  rng?: Rng;
  clock?: ManualClock;
  state?: StateStore;
  saveAdapter?: DevSaveAdapter;
}

export interface GameEngineDevSnapshot {
  kind: "engine";
  version: 1;
  state: GameState;
  nowMs: number;
  cooldowns: CooldownEntrySnapshot[];
  notifications: NotificationCenterSnapshot;
}

export type GameCommand =
  | Command<"state.set", { path: string; value: unknown }>
  | Command<"state.add", { path: string; amount: number }>
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
  readonly rng: Rng;
  readonly clock: ManualClock;
  state: StateStore;
  readonly commands = new CommandBus<GameCommand>();
  readonly events = new EventBus<GameEvents>();
  readonly notifications: NotificationCenter;
  readonly cooldowns: CooldownManager;
  private readonly saveAdapter?: DevSaveAdapter;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? createDefaultRng();
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
      saveScope: "dev-only disposable save",
      rngKind: "seeded deterministic",
      nowMs: this.clock.now(),
    };
  }

  createDevSnapshot(): GameEngineDevSnapshot {
    return {
      kind: "engine",
      version: 1,
      state: this.state.snapshot(),
      nowMs: this.clock.now(),
      cooldowns: this.cooldowns.lifecycleSnapshot(),
      notifications: this.notifications.snapshot(),
    };
  }

  restoreDevSnapshot(data: DevSaveData): boolean {
    if (isEngineDevSnapshot(data)) {
      this.state = new StateStore(data.state);
      this.clock.restoreNow(data.nowMs);
      this.cooldowns.restore(data.cooldowns);
      this.notifications.restore(data.notifications);
      return true;
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
    return this.restoreDevSnapshot(loaded);
  }

  clearDevState(): void {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    this.saveAdapter.clear();
  }

  private registerCoreCommands(): void {
    this.commands.register("state.set", (command) => {
      this.state.set(command.payload.path, command.payload.value);
      this.events.publish("command", command);
    });

    this.commands.register("state.add", (command) => {
      this.state.add(command.payload.path, command.payload.amount);
      this.events.publish("command", command);
    });

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

function isEngineDevSnapshot(data: DevSaveData): data is GameEngineDevSnapshot {
  return (
    data !== null &&
    typeof data === "object" &&
    (data as { kind?: unknown }).kind === "engine" &&
    (data as { version?: unknown }).version === 1 &&
    typeof (data as { nowMs?: unknown }).nowMs === "number" &&
    isLegacyGameState((data as { state?: unknown }).state)
  );
}

function isLegacyGameState(data: DevSaveData): data is GameState {
  return (
    data !== null &&
    typeof data === "object" &&
    typeof (data as { version?: unknown }).version === "number" &&
    typeof (data as { stores?: unknown }).stores === "object" &&
    typeof (data as { game?: unknown }).game === "object"
  );
}
