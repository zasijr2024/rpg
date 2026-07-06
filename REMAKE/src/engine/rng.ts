export interface Rng {
  next(): number;
  nextInt(maxExclusive: number): number;
  fork(seed: number): Rng;
}

export class Mulberry32Rng implements Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("maxExclusive must be a positive integer");
    }
    return Math.floor(this.next() * maxExclusive);
  }

  fork(seed: number): Rng {
    return new Mulberry32Rng(seed);
  }
}

export function createDefaultRng(seed = 0x1fada462): Rng {
  return new Mulberry32Rng(seed);
}

