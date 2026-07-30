type PathToken = string;

const UNSAFE_PATH_TOKENS = new Set(["__proto__", "prototype", "constructor"]);
const BARE_TOKEN_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$-]*$/;

export function parseStatePath(path: string): PathToken[] {
  if (typeof path !== "string" || path.length === 0) {
    throw new Error(`Invalid state path: ${path}`);
  }

  const tokens: string[] = [];
  let index = 0;

  const readBareToken = (): string => {
    const start = index;
    while (index < path.length && path[index] !== "." && path[index] !== "[") {
      index += 1;
    }
    const token = path.slice(start, index);
    if (!BARE_TOKEN_PATTERN.test(token)) invalidPath(path);
    assertSafeToken(token, path);
    return token;
  };

  tokens.push(readBareToken());
  while (index < path.length) {
    if (path[index] === ".") {
      index += 1;
      if (index >= path.length) invalidPath(path);
      tokens.push(readBareToken());
      continue;
    }

    if (path[index] !== "[") invalidPath(path);
    index += 1;
    const quote = path[index];
    if (quote !== '"' && quote !== "'") invalidPath(path);
    index += 1;

    let token = "";
    let closed = false;
    while (index < path.length) {
      const character = path[index];
      if (character === "\\") {
        index += 1;
        const escaped = path[index];
        if (escaped === "u") {
          const hex = path.slice(index + 1, index + 5);
          if (!/^[0-9A-Fa-f]{4}$/.test(hex)) invalidPath(path);
          token += String.fromCharCode(Number.parseInt(hex, 16));
          index += 5;
          continue;
        }
        const escapedCharacters: Record<string, string> = {
          '"': '"',
          "'": "'",
          "\\": "\\",
          "/": "/",
          b: "\b",
          f: "\f",
          n: "\n",
          r: "\r",
          t: "\t",
        };
        if (!(escaped in escapedCharacters)) invalidPath(path);
        token += escapedCharacters[escaped];
        index += 1;
        continue;
      }
      if (character === quote) {
        index += 1;
        if (path[index] !== "]") invalidPath(path);
        index += 1;
        closed = true;
        break;
      }
      token += character;
      index += 1;
    }
    if (!closed || token.length === 0) invalidPath(path);
    assertSafeToken(token, path);
    tokens.push(token);
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

function assertSafeToken(token: string, path: string): void {
  if (UNSAFE_PATH_TOKENS.has(token)) {
    throw new Error(`Unsafe state path token in: ${path}`);
  }
}

function invalidPath(path: string): never {
  throw new Error(`Invalid state path: ${path}`);
}
