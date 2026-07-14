import { describe, expect, it } from "vitest";
import {
  createDefaultRng,
  createProductionSeed,
  Mulberry32Rng,
  restoreRng,
} from "../../engine";

describe("Mulberry32Rng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = new Mulberry32Rng(1234);
    const b = new Mulberry32Rng(1234);

    expect([a.next(), a.next(), a.next()]).toEqual([
      b.next(),
      b.next(),
      b.next(),
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

  it("uses cryptographic random values for production seeds", () => {
    expect(
      createProductionSeed((values) => {
        values[0] = 0xdeadbeef;
        return values;
      }),
    ).toBe(0xdeadbeef);
  });

  it("keeps explicit default seeds reproducible", () => {
    const a = createDefaultRng(42);
    const b = createDefaultRng(42);

    expect(Array.from({ length: 100 }, () => a.next())).toEqual(
      Array.from({ length: 100 }, () => b.next()),
    );
  });

  it("restores the exact next hundred draws from a lifecycle snapshot", () => {
    const original = new Mulberry32Rng(0x12345678);
    Array.from({ length: 37 }, () => original.next());
    const restored = restoreRng(original.lifecycleSnapshot());

    expect(Array.from({ length: 100 }, () => restored.next())).toEqual(
      Array.from({ length: 100 }, () => original.next()),
    );
  });
});
