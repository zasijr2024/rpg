export interface SpacePrototypeConfig {
  width: number;
  height: number;
  shipSize: number;
}

export interface SpacePrototypeState {
  shipX: number;
  shipY: number;
  asteroidX: number;
  asteroidY: number;
}

export const DEFAULT_SPACE_PROTOTYPE: SpacePrototypeConfig = {
  width: 700,
  height: 700,
  shipSize: 18,
};

export function createInitialSpaceState(
  config = DEFAULT_SPACE_PROTOTYPE,
): SpacePrototypeState {
  return {
    shipX: config.width / 2,
    shipY: config.height / 2,
    asteroidX: config.width / 2,
    asteroidY: config.height / 2 - 80,
  };
}

export function hasPrototypeCollision(
  state: SpacePrototypeState,
  config = DEFAULT_SPACE_PROTOTYPE,
): boolean {
  const half = config.shipSize / 2;
  return (
    Math.abs(state.shipX - state.asteroidX) <= half &&
    Math.abs(state.shipY - state.asteroidY) <= half
  );
}
