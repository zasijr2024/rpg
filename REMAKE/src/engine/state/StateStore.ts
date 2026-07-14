import { deletePath, getPath, parseStatePath, setPath } from "./path";
import { createInitialState, type GameState, MAX_STORE } from "./types";

export interface StateUpdate {
  category: string;
  stateName: string;
}

export type StateListener = (update: StateUpdate) => void;

export class StateStore {
  private state: GameState;
  private listeners = new Set<StateListener>();

  constructor(initialState: GameState = createInitialState()) {
    this.state = initialState;
  }

  snapshot(): GameState {
    return structuredClone(this.state);
  }

  get(path: string, requestZero = false): unknown {
    const value = getPath(this.state, path);
    return value === undefined && requestZero ? 0 : value;
  }

  set(path: string, value: unknown, noEvent = false): void {
    setPath(this.state, path, this.clampValue(path, value));
    if (!noEvent) this.fire(path);
  }

  add(path: string, amount: number, noEvent = false): void {
    const current = this.get(path, true);
    if (typeof current !== "number") {
      throw new Error(`Cannot add to non-number state path: ${path}`);
    }

    this.set(path, current + amount, noEvent);
  }

  remove(path: string, noEvent = false): void {
    deletePath(this.state, path);
    if (!noEvent) this.fire(path);
  }

  setM(parent: string, values: Record<string, unknown>, noEvent = false): void {
    for (const [key, value] of Object.entries(values)) {
      this.set(`${parent}["${key}"]`, value, true);
    }
    if (!noEvent) this.fire(parent);
  }

  addM(parent: string, values: Record<string, number>, noEvent = false): void {
    for (const [key, value] of Object.entries(values)) {
      this.add(`${parent}["${key}"]`, value, true);
    }
    if (!noEvent) this.fire(parent);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private fire(path: string): void {
    const [category] = parseStatePath(path);
    const update: StateUpdate = {
      category,
      stateName: path,
    };
    for (const listener of this.listeners) {
      listener(update);
    }
  }

  private clampValue(path: string, value: unknown): unknown {
    if (typeof value !== "number") return value;

    const [category] = parseStatePath(path);
    if (category !== "stores") return value;

    return Math.floor(Math.max(0, Math.min(MAX_STORE, value)));
  }
}
