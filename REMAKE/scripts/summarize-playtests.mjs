import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const MILESTONES = [
  "opening",
  "compass",
  "firstExpedition",
  "deepEconomy",
  "executioner",
  "ship",
  "space",
  "completion",
];
const DEATH_PHASES = [...MILESTONES.slice(0, -1), "ending"];

export function validatePlaytestSession(value, source = "session") {
  if (!isRecord(value)) throw new Error(`${source}: expected an object`);
  assertExactKeys(
    value,
    [
      "schemaVersion",
      "id",
      "participantId",
      "cohortId",
      "recordedAt",
      "revision",
      "ruleset",
      "experienceStatus",
      "operatorId",
      "consentAttested",
      "unassisted",
      "environment",
      "sittings",
      "completed",
      "elapsedMinutes",
      "milestoneMinutes",
      "deathEvents",
      "abandonmentPoint",
      "bottlenecks",
      "technicalExceptions",
      "exclusions",
    ],
    source,
  );
  if (value.schemaVersion !== 2)
    throw new Error(`${source}: schemaVersion must be 2`);
  for (const key of [
    "id",
    "participantId",
    "cohortId",
    "recordedAt",
    "revision",
    "ruleset",
    "experienceStatus",
    "operatorId",
  ]) {
    requireNonEmptyString(value[key], `${source}: ${key}`);
  }
  if (!/^[0-9a-f]{40}$/u.test(value.revision))
    throw new Error(
      `${source}: revision must be an exact 40-character Git SHA`,
    );
  if (Number.isNaN(Date.parse(value.recordedAt)))
    throw new Error(`${source}: recordedAt must be an ISO date-time`);
  if (
    !["first-time", "familiar", "experienced"].includes(value.experienceStatus)
  )
    throw new Error(`${source}: invalid experienceStatus`);
  if (value.consentAttested !== true)
    throw new Error(`${source}: consentAttested must be true`);
  if (value.unassisted !== true)
    throw new Error(`${source}: only genuinely unassisted sessions qualify`);
  if (typeof value.completed !== "boolean")
    throw new Error(`${source}: completed must be boolean`);
  if (!isRecord(value.environment))
    throw new Error(`${source}: environment must be an object`);
  assertExactKeys(
    value.environment,
    ["artifactKind", "artifactId", "browser", "os"],
    `${source}: environment`,
  );
  if (value.environment.artifactKind !== "production-build")
    throw new Error(
      `${source}: environment.artifactKind must be production-build`,
    );
  for (const key of ["artifactId", "browser", "os"]) {
    requireNonEmptyString(
      value.environment[key],
      `${source}: environment.${key}`,
    );
  }
  if (!Array.isArray(value.sittings) || value.sittings.length === 0)
    throw new Error(`${source}: sittings must contain active-play records`);
  for (const [index, sitting] of value.sittings.entries()) {
    if (!isRecord(sitting) || Number.isNaN(Date.parse(sitting.startedAt)))
      throw new Error(`${source}: sittings[${index}].startedAt is invalid`);
    assertExactKeys(
      sitting,
      ["startedAt", "activeMinutes"],
      `${source}: sittings[${index}]`,
    );
    if (!isPositiveNumber(sitting.activeMinutes))
      throw new Error(
        `${source}: sittings[${index}].activeMinutes must be positive`,
      );
  }
  const activeMinutes = value.sittings.reduce(
    (sum, sitting) => sum + sitting.activeMinutes,
    0,
  );
  if (
    !isNonNegativeNumber(value.elapsedMinutes) ||
    value.elapsedMinutes !== activeMinutes
  )
    throw new Error(
      `${source}: elapsedMinutes must equal summed active sitting minutes`,
    );
  if (!isRecord(value.milestoneMinutes))
    throw new Error(`${source}: milestoneMinutes must be an object`);
  assertExactKeys(
    value.milestoneMinutes,
    MILESTONES,
    `${source}: milestoneMinutes`,
  );
  let previous = -1;
  for (const milestone of MILESTONES) {
    const minute = value.milestoneMinutes[milestone];
    if (minute !== null && !isNonNegativeNumber(minute))
      throw new Error(`${source}: invalid milestone minute ${milestone}`);
    if (isNonNegativeNumber(minute)) {
      if (minute < previous || minute > activeMinutes)
        throw new Error(
          `${source}: milestone ${milestone} is out of chronological bounds`,
        );
      previous = minute;
    }
  }
  if (!Array.isArray(value.deathEvents))
    throw new Error(`${source}: deathEvents must be an array`);
  for (const [index, death] of value.deathEvents.entries()) {
    if (
      !isRecord(death) ||
      !isNonNegativeNumber(death.activeMinute) ||
      death.activeMinute > activeMinutes
    )
      throw new Error(
        `${source}: deathEvents[${index}].activeMinute is invalid`,
      );
    assertExactKeys(
      death,
      ["activeMinute", "phase", "cause"],
      `${source}: deathEvents[${index}]`,
    );
    if (!DEATH_PHASES.includes(death.phase))
      throw new Error(`${source}: deathEvents[${index}].phase is invalid`);
    requireNonEmptyString(
      death.cause,
      `${source}: deathEvents[${index}].cause`,
    );
  }
  if (
    !Array.isArray(value.technicalExceptions) ||
    !value.technicalExceptions.every(isNonEmptyString)
  )
    throw new Error(`${source}: technicalExceptions must be a string array`);
  if (
    !Array.isArray(value.exclusions) ||
    !value.exclusions.every(isNonEmptyString)
  )
    throw new Error(`${source}: exclusions must be a string array`);
  if (value.exclusions.length > 0)
    throw new Error(
      `${source}: excluded sessions do not qualify for the decision cohort`,
    );
  if (
    !Array.isArray(value.bottlenecks) ||
    !value.bottlenecks.every(isBottleneck)
  )
    throw new Error(
      `${source}: bottlenecks must contain category and participantWords`,
    );
  for (const [index, bottleneck] of value.bottlenecks.entries())
    assertExactKeys(
      bottleneck,
      ["category", "participantWords"],
      `${source}: bottlenecks[${index}]`,
    );

  const completionMinute = value.milestoneMinutes.completion;
  if (value.completed) {
    if (
      !isNonNegativeNumber(completionMinute) ||
      value.abandonmentPoint !== null
    )
      throw new Error(
        `${source}: completed sessions require completion and no abandonmentPoint`,
      );
  } else if (
    completionMinute !== null ||
    !isNonEmptyString(value.abandonmentPoint)
  ) {
    throw new Error(
      `${source}: incomplete sessions require an abandonmentPoint and no completion`,
    );
  }
  return value;
}

export function validatePlaytestCohort(sessions, source = "cohort") {
  const ids = new Set();
  const participantIds = new Set();
  const identity = new Set();
  for (const session of sessions) {
    validatePlaytestSession(session, `${source}:${session?.id ?? "unknown"}`);
    if (ids.has(session.id))
      throw new Error(`${source}: duplicate session id ${session.id}`);
    if (participantIds.has(session.participantId))
      throw new Error(
        `${source}: duplicate participant id ${session.participantId}`,
      );
    ids.add(session.id);
    participantIds.add(session.participantId);
    identity.add(
      [
        session.cohortId,
        session.revision,
        session.ruleset,
        session.environment.artifactId,
      ].join("|"),
    );
  }
  if (identity.size > 1)
    throw new Error(
      `${source}: mixed cohort, revision, ruleset, or artifact identity`,
    );
  return sessions;
}

export function summarizePlaytests(sessions) {
  validatePlaytestCohort(sessions);
  const completed = sessions.filter((session) => session.completed);
  const milestoneMinutes = Object.fromEntries(
    MILESTONES.map((milestone) => [
      milestone,
      distribution(
        sessions
          .map((session) => session.milestoneMinutes[milestone])
          .filter(isNonNegativeNumber),
      ),
    ]),
  );
  const bottlenecks = new Map();
  for (const session of sessions) {
    for (const bottleneck of session.bottlenecks)
      bottlenecks.set(
        bottleneck.category,
        (bottlenecks.get(bottleneck.category) ?? 0) + 1,
      );
  }
  return {
    cohort: sessions[0]
      ? {
          id: sessions[0].cohortId,
          revision: sessions[0].revision,
          ruleset: sessions[0].ruleset,
          artifactId: sessions[0].environment.artifactId,
        }
      : null,
    sessions: sessions.length,
    completed: completed.length,
    completionRate:
      sessions.length === 0 ? null : completed.length / sessions.length,
    totalDeaths: sessions.reduce(
      (sum, session) => sum + session.deathEvents.length,
      0,
    ),
    completionMinutes: distribution(
      completed.map((session) => session.elapsedMinutes),
    ),
    milestoneMinutes,
    abandonmentPoints: sessions
      .filter((session) => !session.completed)
      .map((session) => session.abandonmentPoint),
    bottlenecks: [...bottlenecks.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label),
      ),
  };
}

export function loadPlaytestSessions(path) {
  const root = resolve(path);
  if (!existsSync(root)) return [];
  const files = statSync(root).isDirectory()
    ? readdirSync(root)
        .filter((file) => file.endsWith(".json"))
        .map((file) => resolve(root, file))
    : [root];
  return validatePlaytestCohort(
    files.map((file) =>
      validatePlaytestSession(JSON.parse(readFileSync(file, "utf8")), file),
    ),
    root,
  );
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
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(sorted.length * quantile) - 1),
    )
  ];
}
function requireNonEmptyString(value, label) {
  if (!isNonEmptyString(value))
    throw new Error(`${label} must be a non-empty string`);
}
function assertExactKeys(value, allowed, label) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0)
    throw new Error(`${label}: unexpected field ${unexpected[0]}`);
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}
function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isPositiveNumber(value) {
  return isNonNegativeNumber(value) && value > 0;
}
function isBottleneck(value) {
  return (
    isRecord(value) &&
    isNonEmptyString(value.category) &&
    isNonEmptyString(value.participantWords)
  );
}

function runCli() {
  const requiredArgument = process.argv.find((argument) =>
    argument.startsWith("--require="),
  );
  const required = Number(requiredArgument?.split("=")[1] ?? 0);
  const input =
    process.argv.slice(2).find((argument) => !argument.startsWith("--")) ??
    "playtests/sessions";
  const sessions = loadPlaytestSessions(input);
  process.stdout.write(
    `${JSON.stringify(summarizePlaytests(sessions), null, 2)}\n`,
  );
  if (Number.isFinite(required) && sessions.length < required) {
    process.stderr.write(
      `playtest evidence: ${sessions.length}/${required} valid same-revision sessions recorded\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runCli();
