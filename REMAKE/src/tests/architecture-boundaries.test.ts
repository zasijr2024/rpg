import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, "src");

function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const imports = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  const sideEffectImports = [
    ...text.matchAll(/import\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);
  return [...imports, ...sideEffectImports];
}

describe("architecture boundaries", () => {
  it("keeps engine independent from React and UI modules", () => {
    const engineFiles = listSourceFiles(join(srcRoot, "engine"));
    const violations = engineFiles.flatMap((file) =>
      importsOf(file)
        .filter(
          (source) =>
            source === "react" ||
            source === "react-dom" ||
            source.includes("/ui/") ||
            source.endsWith("/ui"),
        )
        .map((source) => `${relative(projectRoot, file)} imports ${source}`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps original content independent from UI and expansion content", () => {
    const originalContentFiles = listSourceFiles(
      join(srcRoot, "content", "original"),
    );
    const violations = originalContentFiles.flatMap((file) =>
      importsOf(file)
        .filter(
          (source) =>
            source.includes("/ui/") ||
            source.endsWith("/ui") ||
            source.includes("content/expansions") ||
            source.includes("../expansions") ||
            source.includes("./expansions"),
        )
        .map((source) => `${relative(projectRoot, file)} imports ${source}`),
    );

    expect(violations).toEqual([]);
  });

  it("prevents UI from importing low-level state mutation modules directly", () => {
    const uiFiles = listSourceFiles(join(srcRoot, "ui"));
    const violations = uiFiles.flatMap((file) =>
      importsOf(file)
        .filter(
          (source) =>
            source.includes("/engine/state") ||
            source.includes("../engine/state") ||
            source.includes("StateStore"),
        )
        .map((source) => `${relative(projectRoot, file)} imports ${source}`),
    );

    expect(violations).toEqual([]);
  });

  it("prevents UI components from importing mutable runtime classes directly", () => {
    const uiFiles = listSourceFiles(join(srcRoot, "ui"));
    const violations = uiFiles
      .filter((file) =>
        /\b(RoomRuntime|OutsideRuntime|EventRuntime)\b/.test(
          readFileSync(file, "utf8"),
        ),
      )
      .map((file) => relative(projectRoot, file));

    expect(violations).toEqual([]);
  });

  it("prevents direct Math.random usage in source files", () => {
    const sourceFiles = listSourceFiles(srcRoot).filter(
      (file) => !file.includes(`${join("src", "tests")}`),
    );
    const violations = sourceFiles
      .filter((file) => readFileSync(file, "utf8").includes("Math.random("))
      .map((file) => relative(projectRoot, file));

    expect(violations).toEqual([]);
  });

  it("keeps World encounter and setpiece selection out of EventRuntime", () => {
    const eventRuntime = readFileSync(
      join(srcRoot, "engine", "events", "EventRuntime.ts"),
      "utf8",
    );

    expect(eventRuntime).not.toContain("WORLD_ENCOUNTER_KEYS");
    expect(eventRuntime).not.toContain("WORLD_SETPIECE_EVENT_KEYS");
    expect(eventRuntime).not.toContain("../../content/original/world");
  });
});
