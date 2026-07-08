import { describe, expect, it } from "vitest";
import {
  createAsciiViewport,
  SPIKE_VIEWPORT_SIZE,
  viewportToText,
} from "../../spikes/world/asciiViewport";

describe("ASCII viewport spike", () => {
  it("creates a stable 61 by 61 viewport", () => {
    const viewport = createAsciiViewport();

    expect(viewport.width).toBe(SPIKE_VIEWPORT_SIZE);
    expect(viewport.height).toBe(SPIKE_VIEWPORT_SIZE);
    expect(viewport.rows).toHaveLength(SPIKE_VIEWPORT_SIZE);
    expect(
      viewport.rows.every((row) => row.length === SPIKE_VIEWPORT_SIZE),
    ).toBe(true);
  });

  it("keeps player marker centered", () => {
    const viewport = createAsciiViewport();
    const center = Math.floor(SPIKE_VIEWPORT_SIZE / 2);

    expect(viewport.rows[center][center]).toBe("@");
    expect(viewportToText(viewport).split("\n")).toHaveLength(
      SPIKE_VIEWPORT_SIZE,
    );
  });
});
