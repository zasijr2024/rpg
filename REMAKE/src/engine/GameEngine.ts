import { ManualClock } from "./clock";
import { createDefaultRng, type Rng } from "./rng";
import { StateStore } from "./state/StateStore";
import { createInitialState } from "./state/types";

const SOURCE_COMMIT = "1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7";

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
}

export class GameEngine {
  readonly rng: Rng;
  readonly clock: ManualClock;
  readonly state: StateStore;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? createDefaultRng();
    this.clock = options.clock ?? new ManualClock();
    this.state = options.state ?? new StateStore(createInitialState());
  }

  getSnapshot(): GameEngineSnapshot {
    return {
      sourceCommit: SOURCE_COMMIT,
      saveScope: "dev-only disposable save",
      rngKind: "seeded deterministic",
      nowMs: this.clock.now()
    };
  }
}

export function createGameEngine(options?: GameEngineOptions): GameEngine {
  return new GameEngine(options);
}

