export interface GameState {
  version: number;
  features: Record<string, unknown>;
  stores: Record<string, unknown>;
  character: Record<string, unknown>;
  income: Record<string, unknown>;
  timers: Record<string, unknown>;
  game: Record<string, unknown>;
  playStats: Record<string, unknown>;
  previous: Record<string, unknown>;
  outfit: Record<string, unknown>;
  config: Record<string, unknown>;
  wait: Record<string, unknown>;
  cooldown: Record<string, unknown>;
}

export const ENGINE_VERSION = 1.3;
export const MAX_STORE = 99_999_999_999_999;

export function createInitialState(): GameState {
  return {
    version: ENGINE_VERSION,
    features: {},
    stores: {},
    character: {},
    income: {},
    timers: {},
    game: {},
    playStats: {},
    previous: {},
    outfit: {},
    config: {},
    wait: {},
    cooldown: {}
  };
}
