import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const projectRoot = process.cwd();
const distRoot = join(projectRoot, "dist");
const manifestPath = join(distRoot, ".vite", "manifest.json");
const budgetPath = join(projectRoot, "performance-budgets.json");

function fail(message) {
  throw new Error(`performance budget: ${message}`);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`${label} is missing`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function measure(file) {
  const path = join(distRoot, file);
  if (!existsSync(path)) fail(`emitted asset ${file} is missing`);
  const contents = readFileSync(path);
  return { raw: statSync(path).size, gzip: gzipSync(contents).length };
}

function assertBudget(name, measured, budget) {
  if (measured.raw > budget.maxBytes) {
    fail(`${name} is ${measured.raw} B, above ${budget.maxBytes} B`);
  }
  if (measured.gzip > budget.maxGzipBytes) {
    fail(`${name} gzip is ${measured.gzip} B, above ${budget.maxGzipBytes} B`);
  }
}

const budget = readJson(budgetPath, "performance-budgets.json");
const manifest = readJson(manifestPath, "dist/.vite/manifest.json");
const entry = manifest["index.html"];
if (!entry?.file) fail("manifest has no index.html production entry");

const manifestEntries = Object.values(manifest);
const jsFiles = [...new Set(manifestEntries.map(({ file }) => file))].filter(
  (file) => file.endsWith(".js"),
);
const cssFiles = [
  ...new Set(manifestEntries.flatMap(({ css = [] }) => css)),
].filter((file) => file.endsWith(".css"));
const sum = (files) =>
  files.map(measure).reduce(
    (total, size) => ({
      raw: total.raw + size.raw,
      gzip: total.gzip + size.gzip,
    }),
    { raw: 0, gzip: 0 },
  );

assertBudget(
  "initial JavaScript",
  measure(entry.file),
  budget.bundle.entryJavaScript,
);
assertBudget(
  "all emitted JavaScript",
  sum(jsFiles),
  budget.bundle.allJavaScript,
);
assertBudget("all emitted CSS", sum(cssFiles), budget.bundle.allCss);

const lazyEntries = manifestEntries.filter(
  ({ isDynamicEntry }) => isDynamicEntry,
);
if (lazyEntries.length === 0) fail("manifest has no lazy entries to budget");
for (const lazyEntry of lazyEntries) {
  assertBudget(
    `lazy JavaScript ${lazyEntry.src ?? lazyEntry.file}`,
    measure(lazyEntry.file),
    budget.bundle.lazyEntryJavaScript,
  );
}

process.stdout.write(
  `Performance bundle budgets verified: initial ${measure(entry.file).raw} B / ${measure(entry.file).gzip} B gzip; ${lazyEntries.length} lazy entries.\n`,
);
