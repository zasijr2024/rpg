import { describe, expect, it } from "vitest";
import { Mulberry32Rng } from "../../engine";

describe("Mulberry32Rng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = new Mulberry32Rng(1234);
    const b = new Mulberry32Rng(1234);

    expect([a.next(), a.next(), a.next()]).toEqual([
      b.next(),
      b.next(),
      b.next()
    ]);
  });

  it("generates bounded integers", () => {
    const rng = new Mulberry32Rng(7);
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4);
    }
  });
});

