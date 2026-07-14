import { execFileSync, spawn } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCHEMA_VERSION = 1;
const SEED_BASE = 0x14a00000;
const SEED_STEP = 0x9e3779b9;
const STAGES = [
  "opening",
  "compass",
  "first-expedition",
  "deep-economy",
  "executioner",
  "ship",
  "space",
  "complete",
];
const REPORTED_MILESTONES = STAGES.slice(1);
const FAILURE_CLASSES = ["policy", "game-defect", "unclassified"];

export function progressionSeed(index) {
  requireNonNegativeInteger(index, "seed index");
  return (SEED_BASE + index * SEED_STEP) >>> 0;
}

export function createProgressionShard(seedStart, results) {
  requireNonNegativeInteger(seedStart, "shard seedStart");
  validateResults(results, seedStart, "shard results");
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "phase14-progression-shard",
    seedFormula: { base: SEED_BASE, step: SEED_STEP },
    seedStart,
    seedCount: results.length,
    results,
  };
}

export function writeProgressionShard(path, seedStart, results) {
  const output = resolve(path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(createProgressionShard(seedStart, results), null, 2)}\n`,
    "utf8",
  );
}

export function validateProgressionShard(value, source = "shard") {
  assertRecord(value, source);
  assertExactKeys(
    value,
    [
      "schemaVersion",
      "kind",
      "seedFormula",
      "seedStart",
      "seedCount",
      "results",
    ],
    source,
  );
  if (value.schemaVersion !== SCHEMA_VERSION)
    throw new Error(`${source}: schemaVersion must be ${SCHEMA_VERSION}`);
  if (value.kind !== "phase14-progression-shard")
    throw new Error(`${source}: invalid kind`);
  assertRecord(value.seedFormula, `${source}: seedFormula`);
  assertExactKeys(
    value.seedFormula,
    ["base", "step"],
    `${source}: seedFormula`,
  );
  if (
    value.seedFormula.base !== SEED_BASE ||
    value.seedFormula.step !== SEED_STEP
  )
    throw new Error(`${source}: seed formula does not match the fixed corpus`);
  requireNonNegativeInteger(value.seedStart, `${source}: seedStart`);
  requirePositiveInteger(value.seedCount, `${source}: seedCount`);
  if (!Array.isArray(value.results) || value.results.length !== value.seedCount)
    throw new Error(`${source}: results must match seedCount`);
  validateResults(value.results, value.seedStart, `${source}: results`);
  return value;
}

export function summarizeProgressionResults(results) {
  if (!Array.isArray(results)) throw new Error("results must be an array");
  const completed = results.filter((result) => result.completed);
  const failureClasses = Object.fromEntries(
    FAILURE_CLASSES.map((failureClass) => [
      failureClass,
      results.filter((result) => result.failureClass === failureClass).length,
    ]),
  );
  const stageFailures = Object.fromEntries(
    STAGES.map((stage) => [
      stage,
      results.filter((result) => !result.completed && result.stage === stage)
        .length,
    ]).filter(([, count]) => count > 0),
  );
  const bottlenecks = new Map();
  for (const result of results) {
    if (result.bottleneck)
      bottlenecks.set(
        result.bottleneck,
        (bottlenecks.get(result.bottleneck) ?? 0) + 1,
      );
  }
  return {
    seeds: results.length,
    completed: completed.length,
    completionRate:
      results.length === 0 ? null : completed.length / results.length,
    deaths: results.reduce((sum, result) => sum + result.deaths, 0),
    incidentalEvents: results.reduce(
      (sum, result) => sum + result.incidentalEvents,
      0,
    ),
    combats: results.reduce((sum, result) => sum + result.combats, 0),
    completionMs: distribution(completed.map((result) => result.elapsedMs)),
    milestones: Object.fromEntries(
      REPORTED_MILESTONES.map((stage) => [
        stage,
        distribution(
          results.flatMap((result) => {
            const value = result.milestones[stage];
            return value === undefined ? [] : [value];
          }),
        ),
      ]),
    ),
    failureClasses,
    stageFailures,
    bottlenecks: [...bottlenecks.entries()]
      .map(([detail, count]) => ({ detail, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.detail.localeCompare(right.detail),
      ),
    results,
  };
}

export function aggregateProgressionShards(
  shards,
  { seedStart, seedCount, revision, worktree, environment, command },
) {
  requireNonNegativeInteger(seedStart, "corpus seedStart");
  requirePositiveInteger(seedCount, "corpus seedCount");
  if (!Array.isArray(shards) || shards.length === 0)
    throw new Error("corpus requires at least one shard");
  if (!/^[0-9a-f]{40}$/u.test(revision))
    throw new Error("corpus revision must be an exact 40-character Git SHA");
  if (worktree !== "clean" && worktree !== "dirty")
    throw new Error("corpus worktree must be clean or dirty");
  assertRecord(environment, "corpus environment");
  for (const key of ["node", "npm", "platform", "arch"])
    requireNonEmptyString(environment[key], `corpus environment.${key}`);
  requireNonEmptyString(command, "corpus command");

  const bySeed = new Map();
  for (const [index, candidate] of shards.entries()) {
    const shard = validateProgressionShard(candidate, `shard[${index}]`);
    for (const result of shard.results) {
      if (bySeed.has(result.seed))
        throw new Error(`corpus contains duplicate seed ${result.seed}`);
      bySeed.set(result.seed, result);
    }
  }
  const results = Array.from({ length: seedCount }, (_, offset) => {
    const seed = progressionSeed(seedStart + offset);
    const result = bySeed.get(seed);
    if (!result) throw new Error(`corpus is missing seed ${seed}`);
    return result;
  });
  if (bySeed.size !== seedCount)
    throw new Error(
      `corpus contains ${bySeed.size - seedCount} seed(s) outside the requested range`,
    );

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "phase14-progression-corpus",
    program: "P14V-2026-07-12",
    evidenceClass: "production-command-policy-diagnostic",
    revision,
    worktree,
    environment,
    command,
    seedFormula: { base: SEED_BASE, step: SEED_STEP },
    seedStart,
    seedCount,
    summary: summarizeProgressionResults(results),
  };
}

function validateResults(results, seedStart, source) {
  if (!Array.isArray(results)) throw new Error(`${source}: expected an array`);
  for (const [offset, result] of results.entries()) {
    const label = `${source}[${offset}]`;
    assertRecord(result, label);
    assertExactKeys(
      result,
      [
        "seed",
        "completed",
        "stage",
        "elapsedMs",
        "deaths",
        "incidentalEvents",
        "combats",
        "bottleneck",
        "failureClass",
        "checkpoints",
        "milestones",
      ],
      label,
    );
    if (result.seed !== progressionSeed(seedStart + offset))
      throw new Error(`${label}: seed does not match its fixed corpus index`);
    if (typeof result.completed !== "boolean")
      throw new Error(`${label}: completed must be boolean`);
    if (!STAGES.includes(result.stage))
      throw new Error(`${label}: invalid stage`);
    for (const key of ["elapsedMs", "deaths", "incidentalEvents", "combats"])
      requireNonNegativeInteger(result[key], `${label}: ${key}`);
    if (
      !Array.isArray(result.checkpoints) ||
      !result.checkpoints.every(isNonEmptyString)
    )
      throw new Error(`${label}: checkpoints must be a string array`);
    assertRecord(result.milestones, `${label}: milestones`);
    for (const [stage, elapsedMs] of Object.entries(result.milestones)) {
      if (!STAGES.includes(stage))
        throw new Error(`${label}: invalid milestone ${stage}`);
      requireNonNegativeInteger(elapsedMs, `${label}: milestone ${stage}`);
      if (elapsedMs > result.elapsedMs)
        throw new Error(`${label}: milestone ${stage} exceeds elapsedMs`);
    }
    if (result.completed) {
      if (
        result.stage !== "complete" ||
        result.bottleneck !== null ||
        result.failureClass !== null
      )
        throw new Error(`${label}: completed result has failure state`);
      for (const stage of REPORTED_MILESTONES) {
        if (result.milestones[stage] === undefined)
          throw new Error(`${label}: completed result is missing ${stage}`);
      }
    } else if (
      !isNonEmptyString(result.bottleneck) ||
      !FAILURE_CLASSES.includes(result.failureClass)
    ) {
      throw new Error(`${label}: incomplete result must be classified`);
    }
  }
}

function distribution(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return {
    min: sorted[0],
    median: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    max: sorted.at(-1),
  };
}

function percentile(sorted, quantile) {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * quantile) - 1),
  );
  return sorted[index];
}

function assertRecord(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label}: expected an object`);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value);
  const unexpected = actual.filter((key) => !expected.includes(key));
  const missing = expected.filter((key) => !actual.includes(key));
  if (unexpected.length > 0)
    throw new Error(`${label}: unexpected field ${unexpected[0]}`);
  if (missing.length > 0)
    throw new Error(`${label}: missing field ${missing[0]}`);
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} must be a non-negative integer`);
}

function requirePositiveInteger(value, label) {
  requireNonNegativeInteger(value, label);
  if (value === 0) throw new Error(`${label} must be positive`);
}

function requireNonEmptyString(value, label) {
  if (!isNonEmptyString(value))
    throw new Error(`${label} must be a non-empty string`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function installedNpmVersion(root) {
  const userAgentVersion = process.env.npm_config_user_agent?.match(
    /(?:^|\s)npm\/([^\s]+)/u,
  )?.[1];
  if (userAgentVersion) return userAgentVersion;
  const command =
    process.platform === "win32"
      ? [process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm --version"]]
      : ["npm", ["--version"]];
  return execFileSync(command[0], command[1], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function parsePositiveArgument(name, fallback) {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  const value = Number(argument?.slice(name.length + 3) ?? fallback);
  requirePositiveInteger(value, `--${name}`);
  return value;
}

function parseNonNegativeArgument(name, fallback) {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  const value = Number(argument?.slice(name.length + 3) ?? fallback);
  requireNonNegativeInteger(value, `--${name}`);
  return value;
}

function recordedCommand() {
  const arguments_ = process.argv
    .slice(2)
    .map((argument) =>
      /\s/u.test(argument) ? JSON.stringify(argument) : argument,
    );
  return `node scripts/progression-corpus.mjs ${arguments_.join(" ")}`;
}

async function runShard({ root, temp, seedStart, seedCount }) {
  const output = resolve(temp, `shard-${seedStart}-${seedCount}.json`);
  const log = resolve(temp, `shard-${seedStart}-${seedCount}.log`);
  const descriptor = openSync(log, "w");
  const vitest = resolve(root, "node_modules/vitest/vitest.mjs");
  const child = spawn(
    process.execPath,
    [
      vitest,
      "run",
      "--config",
      "vitest.progression.config.ts",
      "--reporter=dot",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        PHASE14_STUDY_SEEDS: String(seedCount),
        PHASE14_STUDY_START: String(seedStart),
        PHASE14_STUDY_TRACE: "0",
        PHASE14_STUDY_OUTPUT: output,
      },
      stdio: ["ignore", descriptor, descriptor],
    },
  );
  const exitCode = await new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("close", accept);
  }).finally(() => closeSync(descriptor));
  if (exitCode !== 0)
    throw new Error(
      `progression shard ${seedStart}+${seedCount} failed (${exitCode})\n${readFileSync(log, "utf8")}`,
    );
  process.stdout.write(`progression shard ${seedStart}+${seedCount}: passed\n`);
  return JSON.parse(readFileSync(output, "utf8"));
}

async function runCli() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const seedStart = parseNonNegativeArgument("start", 0);
  const seedCount = parsePositiveArgument("seeds", 32);
  const shardSize = parsePositiveArgument("shard-size", 4);
  const jobs = parsePositiveArgument("jobs", 2);
  const outputArgument = process.argv.find((value) =>
    value.startsWith("--output="),
  );
  const output = resolve(
    root,
    outputArgument?.slice("--output=".length) ??
      "../REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-32-seed.json",
  );
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const status = execFileSync("git", ["status", "--short"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const allowDirty = process.argv.includes("--allow-dirty");
  if (status && !allowDirty)
    throw new Error(
      "progression corpus requires a clean candidate; use --allow-dirty only for provisional diagnostics",
    );

  const specs = [];
  for (let offset = 0; offset < seedCount; offset += shardSize)
    specs.push({
      root,
      seedStart: seedStart + offset,
      seedCount: Math.min(shardSize, seedCount - offset),
    });
  const temp = mkdtempSync(resolve(tmpdir(), "adr-p14v-progression-"));
  try {
    const shards = new Array(specs.length);
    let next = 0;
    const workers = await Promise.allSettled(
      Array.from({ length: Math.min(jobs, specs.length) }, async () => {
        while (next < specs.length) {
          const index = next;
          next += 1;
          shards[index] = await runShard({ ...specs[index], temp });
        }
      }),
    );
    const failedWorker = workers.find((worker) => worker.status === "rejected");
    if (failedWorker?.status === "rejected") throw failedWorker.reason;
    const environment = {
      node: process.version,
      npm: installedNpmVersion(root),
      platform: process.platform,
      arch: process.arch,
    };
    const command = recordedCommand();
    const artifact = aggregateProgressionShards(shards, {
      seedStart,
      seedCount,
      revision,
      worktree: status ? "dirty" : "clean",
      environment,
      command,
    });
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
    process.stdout.write(`progression corpus: ${output}\n`);
    const consoleSummary = { ...artifact.summary };
    delete consoleSummary.results;
    process.stdout.write(`${JSON.stringify(consoleSummary, null, 2)}\n`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runCli().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
