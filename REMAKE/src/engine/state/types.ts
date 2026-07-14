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
// The source game accepted values up to 99,999,999,999,999. That boundary can
// no longer be scored exactly with JavaScript numbers once every score-bearing
// store is combined. One trillion remains far beyond reachable play while
// keeping the worst supported score safely below Number.MAX_SAFE_INTEGER.
export const MAX_STORE = 1_000_000_000_000;
export const MAX_EXACT_SCORE = Number.MAX_SAFE_INTEGER;

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
    cooldown: {},
  };
}
