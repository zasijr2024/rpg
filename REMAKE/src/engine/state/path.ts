type PathToken = string;

const PATH_TOKEN_PATTERN = /(?:^|\.)([^.[\]]+)|\["([^"]+)"\]|\['([^']+)'\]/g;

export function parseStatePath(path: string): PathToken[] {
  const tokens: string[] = [];
  for (const match of path.matchAll(PATH_TOKEN_PATTERN)) {
    const token = match[1] ?? match[2] ?? match[3];
    if (token) tokens.push(token);
  }
  if (tokens.length === 0) {
    throw new Error(`Invalid state path: ${path}`);
  }
  return tokens;
}

export function getPath(root: unknown, path: string): unknown {
  const tokens = parseStatePath(path);
  let current = root;
  for (const token of tokens) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}

export function setPath(root: unknown, path: string, value: unknown): void {
  const tokens = parseStatePath(path);
  let current = root as Record<string, unknown>;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const next = current[token];
    if (next === null || typeof next !== "object") {
      current[token] = {};
    }
    current = current[token] as Record<string, unknown>;
  }
  current[tokens[tokens.length - 1]] = value;
}

export function deletePath(root: unknown, path: string): void {
  const tokens = parseStatePath(path);
  let current = root as Record<string, unknown>;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const next = current[token];
    if (next === null || typeof next !== "object") return;
    current = next as Record<string, unknown>;
  }
  delete current[tokens[tokens.length - 1]];
}
