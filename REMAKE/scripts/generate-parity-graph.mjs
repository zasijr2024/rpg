import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "./parity-graph.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../..");
const check = process.argv.includes("--check");
const { canonicalManifest, parityGraph } = buildArtifacts(workspaceRoot);
const outputs = [
  ["DATA/canonical-manifest.json", canonicalManifest],
  ["REMAKE/src/generated/canonical-manifest.json", canonicalManifest],
  ["DATA/parity-graph.json", parityGraph],
  ["REMAKE/src/generated/parity-graph.json", parityGraph],
];

let failed = false;
for (const [relativePath, artifact] of outputs) {
  const path = resolve(workspaceRoot, relativePath);
  const expected = `${JSON.stringify(artifact, null, 2)}\n`;
  if (check) {
    let actual;
    try {
      actual = readFileSync(path, "utf8");
    } catch {
      actual = undefined;
    }
    if (actual !== expected) {
      process.stderr.write(`Generated artifact is stale: ${relativePath}\n`);
      failed = true;
    }
  } else {
    writeFileSync(path, expected, "utf8");
    process.stdout.write(`Wrote ${relativePath}\n`);
  }
}

if (parityGraph.diagnostics.duplicateRequirementIds.length > 0) {
  process.stderr.write("Parity graph contains duplicate requirement IDs.\n");
  failed = true;
}
if (parityGraph.diagnostics.unresolvedTransitions.length > 0) {
  process.stderr.write("Parity graph contains unresolved transitions.\n");
  failed = true;
}
if (failed) process.exitCode = 1;
