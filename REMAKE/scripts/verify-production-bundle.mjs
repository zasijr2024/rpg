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
  `Production bundle boundary verified: event catalog split; ${lateGameViews.length} lazy late-game routes have distinct retry entries; dev/test surfaces absent.\n`,
);
