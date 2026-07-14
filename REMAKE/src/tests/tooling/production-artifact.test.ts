import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { identifyProductionArtifact } from "../../../scripts/production-artifact.mjs";

const temporaryDirectories: string[] = [];

function temporaryArtifact() {
  const directory = mkdtempSync(join(tmpdir(), "adr-artifact-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("production artifact identity", () => {
  it("is stable across creation order and records a sorted file manifest", () => {
    const first = temporaryArtifact();
    const second = temporaryArtifact();
    mkdirSync(join(first, "assets"));
    mkdirSync(join(second, "assets"));
    writeFileSync(join(first, "index.html"), "<main>ADR</main>\n");
    writeFileSync(join(first, "assets", "app.js"), "export {};\n");
    writeFileSync(join(second, "assets", "app.js"), "export {};\n");
    writeFileSync(join(second, "index.html"), "<main>ADR</main>\n");

    const firstIdentity = identifyProductionArtifact(first);
    const secondIdentity = identifyProductionArtifact(second);

    expect(firstIdentity.artifactId).toBe(secondIdentity.artifactId);
    expect(firstIdentity).toMatchObject({
      schemaVersion: 1,
      kind: "adr-production-artifact-identity",
      algorithm: "sha256-tree-v1",
      fileCount: 2,
      files: [{ path: "assets/app.js" }, { path: "index.html" }],
    });
  });

  it("changes when a path or file content changes", () => {
    const directory = temporaryArtifact();
    writeFileSync(join(directory, "index.html"), "first");
    const first = identifyProductionArtifact(directory).artifactId;
    writeFileSync(join(directory, "index.html"), "second");
    const second = identifyProductionArtifact(directory).artifactId;
    writeFileSync(join(directory, "other.html"), "second");
    const third = identifyProductionArtifact(directory).artifactId;

    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });

  it("rejects missing and empty directories", () => {
    const directory = temporaryArtifact();
    expect(() =>
      identifyProductionArtifact(join(directory, "missing")),
    ).toThrow("does not exist");
    expect(() => identifyProductionArtifact(directory)).toThrow("is empty");
  });

  it("fails closed when the command-line expectation does not match", () => {
    const directory = temporaryArtifact();
    writeFileSync(join(directory, "index.html"), "candidate");
    const script = resolve("scripts/production-artifact.mjs");
    const artifactId = identifyProductionArtifact(directory).artifactId;

    const matching = spawnSync(
      process.execPath,
      [script, `--dir=${directory}`, `--expect=${artifactId}`],
      { encoding: "utf8" },
    );
    const mismatching = spawnSync(
      process.execPath,
      [script, `--dir=${directory}`, `--expect=sha256:${"0".repeat(64)}`],
      { encoding: "utf8" },
    );

    expect(matching).toMatchObject({ status: 0, stderr: "" });
    expect(matching.stdout).toContain(`Production artifact: ${artifactId}`);
    expect(mismatching.status).toBe(1);
    expect(mismatching.stderr).toContain(
      `production artifact mismatch: expected sha256:${"0".repeat(64)}, received ${artifactId}`,
    );
  });
});
