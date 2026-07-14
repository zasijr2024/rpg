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
  it("detects changes in every canonical original source file", () => {
    expect(canonicalManifest.files).toHaveLength(123);
    expect(new Set(canonicalManifest.files.map((file) => file.path)).size).toBe(
      canonicalManifest.files.length,
    );

    for (const sourceFile of canonicalManifest.files) {
      expect(sha256(join(workspaceRoot, sourceFile.path))).toBe(
        sourceFile.sha256,
      );
    }
  });
});
