import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const testRoot = resolve(process.cwd(), "src/tests");
const e2eRoot = resolve(testRoot, "e2e");
const allowedEvidenceLabels = new Set([
  "fresh-run",
  "scenario-seeded",
  "headless",
  "browser",
  "visual",
  "manual-a11y",
]);

function collectFiles(directory: string, suffix: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const file = resolve(directory, entry);
    if (statSync(file).isDirectory()) return collectFiles(file, suffix);
    return file.endsWith(suffix) ? [file] : [];
  });
}

function testTitles(source: string): string[] {
  return [...source.matchAll(/(?:^|\n)\s*test\(\s*["']([^"']+)["']/g)].map(
    (match) => match[1] ?? "",
  );
}

describe("test ownership", () => {
  it("keeps the former cross-domain monoliths split into named domain contracts", () => {
    expect(existsSync(resolve(e2eRoot, "app.spec.ts"))).toBe(false);
    expect(existsSync(resolve(testRoot, "engine/event-runtime.test.ts"))).toBe(
      false,
    );
    expect(existsSync(resolve(testRoot, "engine/game-session.test.ts"))).toBe(
      false,
    );
    expect(
      existsSync(resolve(testRoot, "content/event-data-coverage.test.ts")),
    ).toBe(false);

    const requiredContracts = [
      "e2e/room-contracts.spec.ts",
      "e2e/event-contracts.spec.ts",
      "e2e/world-contracts.spec.ts",
      "engine/event-runtime/core.test.ts",
      "engine/event-runtime/world.test.ts",
      "engine/event-runtime/executioner-command.test.ts",
      "engine/game-session/core.test.ts",
      "engine/game-session/landmarks.test.ts",
      "content/event-data/event-pools.test.ts",
      "content/event-data/setpieces.test.ts",
    ];
    for (const contract of requiredContracts) {
      expect(existsSync(resolve(testRoot, contract)), contract).toBe(true);
    }

    const testSources = [
      ...collectFiles(testRoot, ".test.ts"),
      ...collectFiles(testRoot, ".spec.ts"),
    ];
    const oversized = testSources.filter(
      (file) => readFileSync(file, "utf8").split("\n").length > 2_600,
    );
    expect(oversized.map((file) => relative(testRoot, file))).toEqual([]);
  });

  it("requires every browser test to state its evidence label", () => {
    const unlabeled = collectFiles(e2eRoot, ".spec.ts").flatMap((file) =>
      testTitles(readFileSync(file, "utf8"))
        .filter((title) => !allowedEvidenceLabels.has(title.split(":", 1)[0]))
        .map((title) => `${relative(e2eRoot, file)}: ${title}`),
    );

    expect(unlabeled).toEqual([]);
  });
});
