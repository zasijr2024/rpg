export interface Rng {
  next(): number;
  nextInt(maxExclusive: number): number;
  fork(seed: number): Rng;
}

export interface RngLifecycleSnapshot {
  kind: "mulberry32";
  state: number;
}

export interface SerializableRng extends Rng {
  lifecycleSnapshot(): RngLifecycleSnapshot;
}

export type RandomValues = (values: Uint32Array) => Uint32Array;

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

  lifecycleSnapshot(): RngLifecycleSnapshot {
    return {
      kind: "mulberry32",
      state: this.state >>> 0,
    };
  }
}

export function createProductionSeed(
  getRandomValues: RandomValues | undefined = cryptoRandomValues,
): number {
  if (getRandomValues) {
    const values = new Uint32Array(1);
    return getRandomValues(values)[0] ?? 0;
  }
  throw new Error("Production RNG requires crypto.getRandomValues");
}

const cryptoRandomValues: RandomValues | undefined = globalThis.crypto
  ? (values) => {
      globalThis.crypto.getRandomValues(values as never);
      return values;
    }
  : undefined;

export function createDefaultRng(seed?: number): Mulberry32Rng {
  const resolvedSeed = seed ?? createProductionSeed();
  return new Mulberry32Rng(resolvedSeed);
}

export function restoreRng(snapshot: RngLifecycleSnapshot): Mulberry32Rng {
  if (snapshot.kind !== "mulberry32") {
    throw new Error(`Unsupported RNG kind: ${snapshot.kind}`);
  }
  return new Mulberry32Rng(snapshot.state);
}

export function isRngLifecycleSnapshot(
  value: unknown,
): value is RngLifecycleSnapshot {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { kind?: unknown }).kind === "mulberry32" &&
    typeof (value as { state?: unknown }).state === "number" &&
    Number.isInteger((value as { state: number }).state) &&
    (value as { state: number }).state >= 0 &&
    (value as { state: number }).state <= 0xffff_ffff
  );
}

export function isSerializableRng(rng: Rng): rng is SerializableRng {
  return (
    typeof (rng as Partial<SerializableRng>).lifecycleSnapshot === "function"
  );
}
