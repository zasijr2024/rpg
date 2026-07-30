interface StateReader<TPath extends string> {
  get(path: TPath, requestZero?: boolean): unknown;
}

export function readNumber<TPath extends string>(
  state: StateReader<TPath>,
  path: NoInfer<TPath>,
  fallback = 0,
): number {
  const value = state.get(path, true);
  return typeof value === "number" ? value : fallback;
}

export function readBoolean<TPath extends string>(
  state: StateReader<TPath>,
  path: NoInfer<TPath>,
  fallback = false,
): boolean {
  const value = state.get(path, true);
  return typeof value === "boolean" ? value : fallback;
}

export function readNumericRecord<TPath extends string>(
  state: StateReader<TPath>,
  path: NoInfer<TPath>,
): Record<string, number> {
  const value = state.get(path, true);
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );
}

export function readStringUnion<
  TPath extends string,
  const T extends readonly string[],
>(
  state: StateReader<TPath>,
  path: NoInfer<TPath>,
  allowed: T,
): T[number] | null {
  const value = state.get(path, true);
  return typeof value === "string" && allowed.includes(value) ? value : null;
}
