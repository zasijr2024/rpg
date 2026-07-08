import type { StateStore } from "./StateStore";

export function readNumber(
  state: StateStore,
  path: string,
  fallback = 0,
): number {
  const value = state.get(path, true);
  return typeof value === "number" ? value : fallback;
}

export function readBoolean(
  state: StateStore,
  path: string,
  fallback = false,
): boolean {
  const value = state.get(path, true);
  return typeof value === "boolean" ? value : fallback;
}

export function readNumericRecord(
  state: StateStore,
  path: string,
): Record<string, number> {
  const value = state.get(path, true);
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );
}

export function readStringUnion<const T extends readonly string[]>(
  state: StateStore,
  path: string,
  allowed: T,
): T[number] | null {
  const value = state.get(path, true);
  return typeof value === "string" && allowed.includes(value) ? value : null;
}
