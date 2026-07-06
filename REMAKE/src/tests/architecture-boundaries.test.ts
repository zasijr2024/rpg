import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, "src");

function listSourceFiles(dir: string): string[] {
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
    (match) => match[1]
  );
  const sideEffectImports = [...text.matchAll(/import\s+["']([^"']+)["']/g)].map(
    (match) => match[1]
  );
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
            source.endsWith("/ui")
        )
        .map((source) => `${relative(projectRoot, file)} imports ${source}`)
    );

    expect(violations).toEqual([]);
  });

  it("prevents direct Math.random usage in source files", () => {
    const sourceFiles = listSourceFiles(srcRoot).filter(
      (file) => !file.includes(`${join("src", "tests")}`)
    );
    const violations = sourceFiles
      .filter((file) => readFileSync(file, "utf8").includes("Math.random("))
      .map((file) => relative(projectRoot, file));

    expect(violations).toEqual([]);
  });
});
