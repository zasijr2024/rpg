import { describe, expect, it } from "vitest";
import {
  createInitialSpaceState,
  hasPrototypeCollision
} from "../../spikes/space/spacePrototype";

describe("space prototype spike", () => {
  it("can detect simple symbol collision", () => {
    const state = createInitialSpaceState();

    expect(hasPrototypeCollision(state)).toBe(false);
    expect(
      hasPrototypeCollision({
        ...state,
        asteroidX: state.shipX,
        asteroidY: state.shipY
      })
    ).toBe(true);
  });
});

