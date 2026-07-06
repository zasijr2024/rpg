import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalManifest } from "../../content/original";

const workspaceRoot = resolve(process.cwd(), "..");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("source baseline drift", () => {
  it("detects changes in required original source files", () => {
    const required = [
      "ORIGINAL/script/engine.js",
      "ORIGINAL/script/room.js",
      "ORIGINAL/script/outside.js",
      "ORIGINAL/script/path.js",
      "ORIGINAL/script/world.js",
      "ORIGINAL/script/events/setpieces.js"
    ];
    const manifestFiles = new Map(
      canonicalManifest.files.map((file) => [file.path, file.sha256])
    );

    for (const relativePath of required) {
      const expected = manifestFiles.get(relativePath);
      expect(expected).toBeTruthy();
      expect(sha256(join(workspaceRoot, relativePath))).toBe(expected);
    }
  });
});

