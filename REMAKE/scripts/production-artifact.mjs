import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ALGORITHM = "sha256-tree-v1";
const DOMAIN = "adr-production-artifact\0sha256-tree-v1\0";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function listFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`production artifact must not contain symlinks: ${path}`);
    }
    if (entry.isDirectory()) return listFiles(root, path);
    if (!entry.isFile()) {
      throw new Error(
        `production artifact contains an unsupported entry: ${path}`,
      );
    }
    return [path];
  });
}

export function identifyProductionArtifact(directory) {
  const root = resolve(directory);
  const rootStat = statSync(root, { throwIfNoEntry: false });
  if (!rootStat?.isDirectory()) {
    throw new Error(`production artifact directory does not exist: ${root}`);
  }

  const files = listFiles(root)
    .map((path) => {
      const bytes = readFileSync(path);
      return {
        path: relative(root, path).split(sep).join("/"),
        bytes: bytes.byteLength,
        sha256: sha256(bytes),
      };
    })
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );

  if (files.length === 0) {
    throw new Error(`production artifact directory is empty: ${root}`);
  }

  const digest = createHash("sha256");
  digest.update(DOMAIN);
  for (const file of files) {
    digest.update(`${file.path}\0${file.bytes}\0${file.sha256}\0`);
  }

  return {
    schemaVersion: 1,
    kind: "adr-production-artifact-identity",
    algorithm: ALGORITHM,
    artifactId: `sha256:${digest.digest("hex")}`,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files,
  };
}

function parseArguments(arguments_) {
  let directory = "dist";
  let json = false;
  let expected = null;
  for (const argument of arguments_) {
    if (argument === "--json") json = true;
    else if (argument.startsWith("--dir=")) directory = argument.slice(6);
    else if (argument.startsWith("--expect=")) expected = argument.slice(9);
    else throw new Error(`unknown argument: ${argument}`);
  }
  return { directory, json, expected };
}

function main() {
  const { directory, json, expected } = parseArguments(process.argv.slice(2));
  const identity = identifyProductionArtifact(directory);
  if (expected !== null && identity.artifactId !== expected) {
    throw new Error(
      `production artifact mismatch: expected ${expected}, received ${identity.artifactId}`,
    );
  }
  if (json) process.stdout.write(`${JSON.stringify(identity, null, 2)}\n`);
  else {
    process.stdout.write(
      `Production artifact: ${identity.artifactId}\n` +
        `Algorithm: ${identity.algorithm}; files: ${identity.fileCount}; bytes: ${identity.totalBytes}\n`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
