import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const distRoot = join(projectRoot, "dist");
const manifestPath = join(distRoot, ".vite", "manifest.json");

function fail(message) {
  throw new Error(`production bundle boundary: ${message}`);
}

function filesBelow(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

if (!existsSync(manifestPath)) {
  fail("dist/.vite/manifest.json is missing; run the production build first");
}

const requiredNotices = [
  ["LICENSE.txt", "Mozilla Public License Version 2.0"],
  ["NOTICE.txt", "Michael Townsend / doublespeak games"],
];
for (const [file, marker] of requiredNotices) {
  const path = join(distRoot, file);
  if (!existsSync(path))
    fail(`${file} is missing from the production artifact`);
  if (!readFileSync(path, "utf8").includes(marker)) {
    fail(`${file} does not contain the required attribution marker`);
  }
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const emittedText = filesBelow(distRoot)
  .filter((file) => /\.(?:css|html|js)$/.test(file))
  .map((file) => [relative(distRoot, file), readFileSync(file, "utf8")]);

const forbiddenMarkers = [
  "__adrTest",
  "Phase 0.5 risk spike",
  "Canvas space prototype",
  "world keyboard probe",
  "testHarness",
];

for (const marker of forbiddenMarkers) {
  const owner = emittedText.find(([, text]) => text.includes(marker));
  if (owner)
    fail(`${owner[0]} contains forbidden marker ${JSON.stringify(marker)}`);
}

const forbiddenSources = [
  "src/testing/",
  "src/spikes/",
  "src/ui/SpikeLab.tsx",
  "src/ui/SettingsView.tsx",
];
for (const source of forbiddenSources) {
  if (Object.keys(manifest).some((key) => key.startsWith(source))) {
    fail(`manifest contains development source ${source}`);
  }
}

const lateGameViews = [
  "src/ui/FabricatorView.tsx",
  "src/ui/ShipView.tsx",
  "src/ui/SpaceView.tsx",
];
const MAX_RETRY_FACADE_BYTES = 512;
for (const source of lateGameViews) {
  const entry = manifest[source];
  if (!entry?.isDynamicEntry) {
    fail(`${source} is not emitted as a dynamic entry`);
  }
  const retryEntry = manifest[`${source}?route-retry`];
  if (!retryEntry?.isDynamicEntry) {
    fail(`${source} has no dynamic retry entry`);
  }
  if (retryEntry.file === entry.file) {
    fail(`${source} retry entry reuses the failed module URL`);
  }
  if (!retryEntry.dynamicImports?.includes(source)) {
    fail(`${source} retry entry does not dynamically import its view`);
  }
  const originalChunkName = entry.file.split("/").at(-1);
  const escapedChunkName = originalChunkName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const retryPath = join(distRoot, retryEntry.file);
  if (statSync(retryPath).size > MAX_RETRY_FACADE_BYTES) {
    fail(
      `${source} retry entry exceeds the ${MAX_RETRY_FACADE_BYTES} B facade boundary`,
    );
  }
  const retryCode = readFileSync(retryPath, "utf8");
  const freshImport = new RegExp(
    String.raw`\bimport\(\s*(["'\x60])\.\/${escapedChunkName}\?route-retry\1\s*\)`,
  );
  if (!freshImport.test(retryCode)) {
    fail(`${source} retry entry does not request a fresh query-suffixed URL`);
  }
}

const eventCatalog = Object.entries(manifest).find(
  ([, entry]) => entry.name === "event-catalog",
);
if (!eventCatalog) {
  fail("event content is not emitted as its own catalog chunk");
}
const productionEntry = manifest["index.html"];
if (!productionEntry?.imports?.includes(eventCatalog[0])) {
  fail("the production entry does not reference the event catalog chunk");
}

process.stdout.write(
  `Production bundle boundary verified: event catalog split; ${lateGameViews.length} lazy late-game routes have fresh query-suffixed retry entries; license/notices present; dev/test surfaces absent.\n`,
);
