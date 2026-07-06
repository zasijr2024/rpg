import rawManifest from "../../../generated/canonical-manifest.json";
import type { CanonicalManifest } from "./types";

export const canonicalManifest = rawManifest as CanonicalManifest;

export const SOURCE_BASELINE_COMMIT =
  "1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7";

export function assertCanonicalManifest(manifest: CanonicalManifest): void {
  if (manifest.source.commit !== SOURCE_BASELINE_COMMIT) {
    throw new Error(
      `Unexpected source commit ${manifest.source.commit}; expected ${SOURCE_BASELINE_COMMIT}`
    );
  }

  const requiredFiles = [
    "ORIGINAL/script/engine.js",
    "ORIGINAL/script/room.js",
    "ORIGINAL/script/outside.js",
    "ORIGINAL/script/path.js",
    "ORIGINAL/script/world.js",
    "ORIGINAL/script/events/setpieces.js"
  ];

  const filePaths = new Set(manifest.files.map((file) => file.path));
  for (const file of requiredFiles) {
    if (!filePaths.has(file)) {
      throw new Error(`Canonical manifest missing required source file: ${file}`);
    }
  }
}

assertCanonicalManifest(canonicalManifest);

