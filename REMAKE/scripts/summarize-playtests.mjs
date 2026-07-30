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
const MILESTONE_PREDECESSORS = [
  ["opening", "compass"],
  ["compass", "firstExpedition"],
  ["firstExpedition", "deepEconomy"],
  ["firstExpedition", "executioner"],
  ["firstExpedition", "ship"],
  ["ship", "space"],
  ["space", "completion"],
];
const MODE_POLICIES = ["classic-locked", "hyper-locked", "timeline-recorded"];
const MODES = ["classic", "hyper"];
const MINUTE_TOLERANCE = 0.01;
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u;
const GIT_REVISION = /^[0-9a-f]{40}$/u;
const PRODUCTION_ARTIFACT_ID = /^sha256:[0-9a-f]{64}$/u;
const RELEASE_BINDING_OPTIONS = [
  ["--expected-revision=", "revision"],
  ["--expected-artifact-id=", "artifactId"],
  ["--expected-cohort-id=", "cohortId"],
  ["--expected-ruleset=", "ruleset"],
  ["--expected-mode-policy=", "modePolicy"],
];

export const PLAYTEST_CLI_HELP = `Usage:
  node scripts/summarize-playtests.mjs [path]
  node scripts/summarize-playtests.mjs [path] --require=N [release-binding-options]

Release binding options (all required with --require):
  --expected-revision=<40-character-git-sha>
  --expected-artifact-id=<sha256:64-lowercase-hex>
  --expected-cohort-id=<cohort-id>
  --expected-ruleset=<ruleset>
  --expected-mode-policy=<classic-locked|hyper-locked|timeline-recorded>

Normal summaries include first-time and exploratory sessions. A --require gate
counts only first-time participants and requires every expected candidate value.
`;

export const RELEASE_EVIDENCE_MINIMUM = 5;

export function resolvePlaytestEvidenceMinimum(requestedMinimum = 0) {
  if (
    !Number.isInteger(requestedMinimum) ||
    requestedMinimum < 0 ||
    !Number.isFinite(requestedMinimum)
  )
    throw new Error("--require must be a non-negative integer");
  return requestedMinimum === 0
    ? 0
    : Math.max(requestedMinimum, RELEASE_EVIDENCE_MINIMUM);
}

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
      "modePolicy",
      "modeTimeline",
      "experienceStatus",
      "operatorId",
      "consentAttested",
      "unassisted",
      "environment",
      "wallStartedAt",
      "wallEndedAt",
      "sittings",
      "closedPageGaps",
      "foregroundActiveMinutes",
      "backgroundOpenMinutes",
      "closedPageMinutes",
      "wallElapsedMinutes",
      "completed",
      "milestones",
      "deathEvents",
      "abandonmentPoint",
      "bottlenecks",
      "technicalExceptions",
      "exclusions",
    ],
    source,
  );
  if (value.schemaVersion !== 3)
    throw new Error(`${source}: schemaVersion must be 3`);
  for (const key of [
    "id",
    "participantId",
    "cohortId",
    "revision",
    "ruleset",
    "experienceStatus",
    "operatorId",
  ]) {
    requireNonEmptyString(value[key], `${source}: ${key}`);
  }
  if (!GIT_REVISION.test(value.revision))
    throw new Error(
      `${source}: revision must be an exact 40-character Git SHA`,
    );
  const recordedAt = parseInstant(value.recordedAt, `${source}: recordedAt`);
  const wallStartedAt = parseInstant(
    value.wallStartedAt,
    `${source}: wallStartedAt`,
  );
  const wallEndedAt = parseInstant(value.wallEndedAt, `${source}: wallEndedAt`);
  if (wallEndedAt <= wallStartedAt)
    throw new Error(`${source}: wallEndedAt must be after wallStartedAt`);
  if (recordedAt < wallEndedAt)
    throw new Error(`${source}: recordedAt cannot precede wallEndedAt`);
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

  validateEnvironment(value.environment, source);
  const time = validateTimeAccounting(
    value,
    source,
    wallStartedAt,
    wallEndedAt,
  );
  validateModeTimeline(value, source, wallStartedAt, wallEndedAt, time);
  validateMilestones(value, source, wallStartedAt, wallEndedAt, time);
  validateDeathEvents(value, source, wallStartedAt, wallEndedAt, time);
  validateQualitativeEvidence(value, source);

  const completion = value.milestones.completion;
  if (value.completed) {
    if (completion === null || value.abandonmentPoint !== null)
      throw new Error(
        `${source}: completed sessions require completion and no abandonmentPoint`,
      );
  } else if (completion !== null || !isNonEmptyString(value.abandonmentPoint)) {
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
        session.modePolicy,
        session.environment.artifactId,
      ].join("|"),
    );
  }
  if (identity.size > 1)
    throw new Error(
      `${source}: mixed cohort, revision, ruleset, mode policy, or artifact identity`,
    );
  return sessions;
}

export function summarizePlaytests(sessions) {
  validatePlaytestCohort(sessions);
  const completed = sessions.filter((session) => session.completed);
  const releaseEligible = sessions.filter(
    (session) => session.experienceStatus === "first-time",
  );
  const milestoneMinutes = Object.fromEntries(
    MILESTONES.map((milestone) => [
      milestone,
      {
        foregroundActive: distribution(
          sessions
            .map(
              (session) =>
                session.milestones[milestone]?.foregroundActiveMinute,
            )
            .filter(isNonNegativeNumber),
        ),
        wall: distribution(
          sessions
            .map((session) => session.milestones[milestone]?.wallMinute)
            .filter(isNonNegativeNumber),
        ),
      },
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
          modePolicy: sessions[0].modePolicy,
          artifactId: sessions[0].environment.artifactId,
        }
      : null,
    releaseEvidence: {
      minimumSessions: RELEASE_EVIDENCE_MINIMUM,
      qualifyingFirstTimeSessions: releaseEligible.length,
      exploratorySessionsExcludedFromGate:
        sessions.length - releaseEligible.length,
      minimumMet: releaseEligible.length >= RELEASE_EVIDENCE_MINIMUM,
    },
    sessions: sessions.length,
    completed: completed.length,
    completionRate:
      sessions.length === 0 ? null : completed.length / sessions.length,
    totalDeaths: sessions.reduce(
      (sum, session) => sum + session.deathEvents.length,
      0,
    ),
    timeMinutes: {
      foregroundActive: distribution(
        sessions.map((session) => session.foregroundActiveMinutes),
      ),
      backgroundOpen: distribution(
        sessions.map((session) => session.backgroundOpenMinutes),
      ),
      closedPage: distribution(
        sessions.map((session) => session.closedPageMinutes),
      ),
      wallElapsed: distribution(
        sessions.map((session) => session.wallElapsedMinutes),
      ),
    },
    completionMinutes: {
      foregroundActive: distribution(
        completed.map(
          (session) => session.milestones.completion.foregroundActiveMinute,
        ),
      ),
      wall: distribution(
        completed.map((session) => session.milestones.completion.wallMinute),
      ),
    },
    milestoneMinutes,
    modeExposure: {
      classicOnlySessions: sessions.filter((session) =>
        session.modeTimeline.every(({ mode }) => mode === "classic"),
      ).length,
      hyperExposedSessions: sessions.filter((session) =>
        session.modeTimeline.some(({ mode }) => mode === "hyper"),
      ).length,
      recordedTransitions: sessions.reduce(
        (sum, session) => sum + Math.max(0, session.modeTimeline.length - 1),
        0,
      ),
    },
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
        .sort()
        .map((file) => resolve(root, file))
    : [root];
  return validatePlaytestCohort(
    files.map((file) =>
      validatePlaytestSession(JSON.parse(readFileSync(file, "utf8")), file),
    ),
    root,
  );
}

export function validatePlaytestReleaseBinding(sessions, expected) {
  validatePlaytestCohort(sessions);
  const binding = validateExpectedReleaseBinding(expected);
  const fields = [
    ["revision", "revision", (session) => session.revision],
    ["artifactId", "artifact ID", (session) => session.environment.artifactId],
    ["cohortId", "cohort ID", (session) => session.cohortId],
    ["ruleset", "ruleset", (session) => session.ruleset],
    ["modePolicy", "mode policy", (session) => session.modePolicy],
  ];
  for (const session of sessions) {
    for (const [key, label, readActual] of fields) {
      const actual = readActual(session);
      if (actual !== binding[key])
        throw new Error(
          `release gate ${label} mismatch: expected ${binding[key]}, received ${actual}`,
        );
    }
  }
  return sessions.filter(
    (session) => session.experienceStatus === "first-time",
  );
}

export function parsePlaytestCliArguments(arguments_) {
  if (arguments_.includes("--help") || arguments_.includes("-h"))
    return {
      help: true,
      input: "playtests/sessions",
      required: 0,
      expected: null,
    };

  let input = "playtests/sessions";
  let inputWasProvided = false;
  let requestedMinimum = 0;
  const expected = {};
  const seenOptions = new Set();
  for (const argument of arguments_) {
    if (argument.startsWith("--require=")) {
      assertUniqueCliOption(seenOptions, "--require");
      const raw = argument.slice("--require=".length);
      if (raw === "") throw new Error("--require needs a value");
      requestedMinimum = Number(raw);
      continue;
    }
    const bindingOption = RELEASE_BINDING_OPTIONS.find(([prefix]) =>
      argument.startsWith(prefix),
    );
    if (bindingOption) {
      const [prefix, key] = bindingOption;
      const option = prefix.slice(0, -1);
      assertUniqueCliOption(seenOptions, option);
      const value = argument.slice(prefix.length);
      if (value === "") throw new Error(`${option} needs a value`);
      expected[key] = value;
      continue;
    }
    if (argument.startsWith("--"))
      throw new Error(`unknown argument: ${argument}\n${PLAYTEST_CLI_HELP}`);
    if (inputWasProvided)
      throw new Error(`unexpected second input path: ${argument}`);
    input = argument;
    inputWasProvided = true;
  }

  const required = resolvePlaytestEvidenceMinimum(requestedMinimum);
  const bindingRequested = Object.keys(expected).length > 0;
  return {
    help: false,
    input,
    required,
    expected:
      required > 0 || bindingRequested
        ? validateExpectedReleaseBinding(expected)
        : null,
  };
}

function validateEnvironment(environment, source) {
  if (!isRecord(environment))
    throw new Error(`${source}: environment must be an object`);
  assertExactKeys(
    environment,
    ["artifactKind", "artifactId", "browser", "os"],
    `${source}: environment`,
  );
  if (environment.artifactKind !== "production-build")
    throw new Error(
      `${source}: environment.artifactKind must be production-build`,
    );
  if (!PRODUCTION_ARTIFACT_ID.test(environment.artifactId))
    throw new Error(
      `${source}: environment.artifactId must be sha256 followed by 64 lowercase hexadecimal characters`,
    );
  for (const key of ["browser", "os"])
    requireNonEmptyString(environment[key], `${source}: environment.${key}`);
}

function validateTimeAccounting(value, source, wallStartedAt, wallEndedAt) {
  if (!Array.isArray(value.sittings) || value.sittings.length === 0)
    throw new Error(`${source}: sittings must contain page-open records`);
  const sittings = [];
  let foregroundActiveMinutes = 0;
  let backgroundOpenMinutes = 0;
  for (const [index, sitting] of value.sittings.entries()) {
    const label = `${source}: sittings[${index}]`;
    if (!isRecord(sitting)) throw new Error(`${label} must be an object`);
    assertExactKeys(
      sitting,
      [
        "startedAt",
        "endedAt",
        "foregroundActiveMinutes",
        "backgroundOpenMinutes",
      ],
      label,
    );
    const startedAt = parseInstant(sitting.startedAt, `${label}.startedAt`);
    const endedAt = parseInstant(sitting.endedAt, `${label}.endedAt`);
    if (endedAt <= startedAt)
      throw new Error(`${label}.endedAt must be after startedAt`);
    if (startedAt < wallStartedAt || endedAt > wallEndedAt)
      throw new Error(`${label} is outside session wall-clock bounds`);
    if (sittings.at(-1)?.endedAt >= startedAt)
      throw new Error(`${label} overlaps or touches the previous sitting`);
    for (const key of ["foregroundActiveMinutes", "backgroundOpenMinutes"])
      if (!isNonNegativeNumber(sitting[key]))
        throw new Error(`${label}.${key} must be non-negative`);
    const openMinutes = minutesBetween(startedAt, endedAt);
    if (
      !approximatelyEqual(
        sitting.foregroundActiveMinutes + sitting.backgroundOpenMinutes,
        openMinutes,
      )
    )
      throw new Error(
        `${label}: foreground-active plus background-open minutes must equal its wall duration`,
      );
    foregroundActiveMinutes += sitting.foregroundActiveMinutes;
    backgroundOpenMinutes += sitting.backgroundOpenMinutes;
    sittings.push({
      startedAt,
      endedAt,
      foregroundActiveMinutes: sitting.foregroundActiveMinutes,
      backgroundOpenMinutes: sitting.backgroundOpenMinutes,
    });
  }
  if (sittings[0].startedAt !== wallStartedAt)
    throw new Error(
      `${source}: wallStartedAt must equal the first sitting start`,
    );
  if (sittings.at(-1).endedAt !== wallEndedAt)
    throw new Error(`${source}: wallEndedAt must equal the last sitting end`);

  if (!Array.isArray(value.closedPageGaps))
    throw new Error(`${source}: closedPageGaps must be an array`);
  if (value.closedPageGaps.length !== sittings.length - 1)
    throw new Error(
      `${source}: closedPageGaps must explicitly cover every gap between sittings`,
    );
  let closedPageMinutes = 0;
  for (const [index, gap] of value.closedPageGaps.entries()) {
    const label = `${source}: closedPageGaps[${index}]`;
    if (!isRecord(gap)) throw new Error(`${label} must be an object`);
    assertExactKeys(gap, ["startedAt", "endedAt"], label);
    const startedAt = parseInstant(gap.startedAt, `${label}.startedAt`);
    const endedAt = parseInstant(gap.endedAt, `${label}.endedAt`);
    if (
      startedAt !== sittings[index].endedAt ||
      endedAt !== sittings[index + 1].startedAt
    )
      throw new Error(
        `${label} must exactly bridge the adjacent page-open sittings`,
      );
    closedPageMinutes += minutesBetween(startedAt, endedAt);
  }

  const wallElapsedMinutes = minutesBetween(wallStartedAt, wallEndedAt);
  for (const [key, expected, positive] of [
    ["foregroundActiveMinutes", foregroundActiveMinutes, true],
    ["backgroundOpenMinutes", backgroundOpenMinutes, false],
    ["closedPageMinutes", closedPageMinutes, false],
    ["wallElapsedMinutes", wallElapsedMinutes, true],
  ]) {
    if (
      !(positive
        ? isPositiveNumber(value[key])
        : isNonNegativeNumber(value[key]))
    )
      throw new Error(`${source}: ${key} is invalid`);
    if (!approximatelyEqual(value[key], expected))
      throw new Error(`${source}: ${key} does not match timestamp accounting`);
  }
  if (
    !approximatelyEqual(
      foregroundActiveMinutes + backgroundOpenMinutes + closedPageMinutes,
      wallElapsedMinutes,
    )
  )
    throw new Error(
      `${source}: foreground, background-open, and closed-page minutes must reconcile to wall time`,
    );
  return {
    sittings,
    foregroundActiveMinutes,
    backgroundOpenMinutes,
    closedPageMinutes,
    wallElapsedMinutes,
  };
}

function validateModeTimeline(value, source, wallStartedAt, wallEndedAt, time) {
  if (!MODE_POLICIES.includes(value.modePolicy))
    throw new Error(`${source}: invalid modePolicy`);
  if (!Array.isArray(value.modeTimeline) || value.modeTimeline.length === 0)
    throw new Error(`${source}: modeTimeline must contain at least one entry`);
  let previousAt = -1;
  let previousMode = null;
  for (const [index, entry] of value.modeTimeline.entries()) {
    const label = `${source}: modeTimeline[${index}]`;
    if (!isRecord(entry)) throw new Error(`${label} must be an object`);
    assertExactKeys(entry, ["at", "mode"], label);
    const at = parseInstant(entry.at, `${label}.at`);
    if (!MODES.includes(entry.mode))
      throw new Error(`${label}.mode must be classic or hyper`);
    if (at < wallStartedAt || at > wallEndedAt || at <= previousAt)
      throw new Error(`${label}.at is outside chronological wall bounds`);
    if (!instantIsPageOpen(at, time.sittings))
      throw new Error(`${label}.at must occur while the page is open`);
    if (previousMode === entry.mode)
      throw new Error(
        `${label} repeats the previous mode without a transition`,
      );
    previousAt = at;
    previousMode = entry.mode;
  }
  if (parseInstant(value.modeTimeline[0].at) !== wallStartedAt)
    throw new Error(`${source}: modeTimeline must begin at wallStartedAt`);
  if (value.modePolicy === "timeline-recorded") return;
  const lockedMode =
    value.modePolicy === "classic-locked" ? "classic" : "hyper";
  if (
    value.modeTimeline.length !== 1 ||
    value.modeTimeline[0].mode !== lockedMode
  )
    throw new Error(
      `${source}: ${value.modePolicy} requires one matching mode entry at wallStartedAt`,
    );
}

function validateMilestones(value, source, wallStartedAt, wallEndedAt, time) {
  if (!isRecord(value.milestones))
    throw new Error(`${source}: milestones must be an object`);
  assertExactKeys(value.milestones, MILESTONES, `${source}: milestones`);
  for (const milestone of MILESTONES) {
    const record = value.milestones[milestone];
    if (record === null) continue;
    const label = `${source}: milestones.${milestone}`;
    if (!isRecord(record))
      throw new Error(`${label} must be an object or null`);
    assertExactKeys(
      record,
      ["reachedAt", "foregroundActiveMinute", "wallMinute"],
      label,
    );
    const reachedAt = parseInstant(record.reachedAt, `${label}.reachedAt`);
    if (reachedAt < wallStartedAt || reachedAt > wallEndedAt)
      throw new Error(`${label}.reachedAt is outside session wall bounds`);
    if (!instantIsPageOpen(reachedAt, time.sittings))
      throw new Error(`${label}.reachedAt must occur while the page is open`);
    if (
      !isNonNegativeNumber(record.foregroundActiveMinute) ||
      record.foregroundActiveMinute > time.foregroundActiveMinutes
    )
      throw new Error(`${label}.foregroundActiveMinute is invalid`);
    assertPossibleForegroundMinute(
      record.foregroundActiveMinute,
      reachedAt,
      time.sittings,
      `${label}.foregroundActiveMinute`,
    );
    const derivedWallMinute = minutesBetween(wallStartedAt, reachedAt);
    if (
      !isNonNegativeNumber(record.wallMinute) ||
      record.wallMinute > time.wallElapsedMinutes ||
      !approximatelyEqual(record.wallMinute, derivedWallMinute)
    )
      throw new Error(`${label}.wallMinute must match reachedAt`);
  }
  for (const [predecessor, successor] of MILESTONE_PREDECESSORS)
    assertMilestoneOrder(value.milestones, predecessor, successor, source);
}

function validateDeathEvents(value, source, wallStartedAt, wallEndedAt, time) {
  if (!Array.isArray(value.deathEvents))
    throw new Error(`${source}: deathEvents must be an array`);
  for (const [index, death] of value.deathEvents.entries()) {
    const label = `${source}: deathEvents[${index}]`;
    if (!isRecord(death)) throw new Error(`${label} must be an object`);
    assertExactKeys(
      death,
      ["occurredAt", "foregroundActiveMinute", "wallMinute", "phase", "cause"],
      label,
    );
    const occurredAt = parseInstant(death.occurredAt, `${label}.occurredAt`);
    if (
      occurredAt < wallStartedAt ||
      occurredAt > wallEndedAt ||
      !instantIsPageOpen(occurredAt, time.sittings)
    )
      throw new Error(`${label}.occurredAt must be within a page-open sitting`);
    if (
      !isNonNegativeNumber(death.foregroundActiveMinute) ||
      death.foregroundActiveMinute > time.foregroundActiveMinutes
    )
      throw new Error(`${label}.foregroundActiveMinute is invalid`);
    assertPossibleForegroundMinute(
      death.foregroundActiveMinute,
      occurredAt,
      time.sittings,
      `${label}.foregroundActiveMinute`,
    );
    if (
      !isNonNegativeNumber(death.wallMinute) ||
      !approximatelyEqual(
        death.wallMinute,
        minutesBetween(wallStartedAt, occurredAt),
      )
    )
      throw new Error(`${label}.wallMinute must match occurredAt`);
    if (!DEATH_PHASES.includes(death.phase))
      throw new Error(`${label}.phase is invalid`);
    requireNonEmptyString(death.cause, `${label}.cause`);
  }
}

function validateQualitativeEvidence(value, source) {
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
  if (!Array.isArray(value.bottlenecks))
    throw new Error(`${source}: bottlenecks must be an array`);
  for (const [index, bottleneck] of value.bottlenecks.entries()) {
    const label = `${source}: bottlenecks[${index}]`;
    if (!isRecord(bottleneck)) throw new Error(`${label} must be an object`);
    assertExactKeys(bottleneck, ["category", "participantWords"], label);
    requireNonEmptyString(bottleneck.category, `${label}.category`);
    requireNonEmptyString(
      bottleneck.participantWords,
      `${label}.participantWords`,
    );
  }
}

function assertMilestoneOrder(milestones, predecessor, successor, source) {
  const before = milestones[predecessor];
  const after = milestones[successor];
  if (after === null) return;
  if (before === null)
    throw new Error(
      `${source}: milestone ${successor} requires ${predecessor}`,
    );
  if (
    after.foregroundActiveMinute < before.foregroundActiveMinute ||
    after.wallMinute < before.wallMinute
  )
    throw new Error(
      `${source}: milestone ${successor} precedes ${predecessor}`,
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

function parseInstant(value, label = "date-time") {
  if (typeof value !== "string" || !ISO_DATE_TIME.test(value))
    throw new Error(`${label} must be an ISO date-time with a timezone`);
  const instant = Date.parse(value);
  if (Number.isNaN(instant))
    throw new Error(`${label} must be a valid ISO date-time`);
  return instant;
}

function minutesBetween(startedAt, endedAt) {
  return (endedAt - startedAt) / 60000;
}

function approximatelyEqual(left, right) {
  return Math.abs(left - right) <= MINUTE_TOLERANCE;
}

function instantIsPageOpen(instant, sittings) {
  return sittings.some(
    ({ startedAt, endedAt }) => instant >= startedAt && instant <= endedAt,
  );
}

function assertPossibleForegroundMinute(value, instant, sittings, label) {
  let completedForeground = 0;
  for (const sitting of sittings) {
    if (instant > sitting.endedAt) {
      completedForeground += sitting.foregroundActiveMinutes;
      continue;
    }
    if (instant < sitting.startedAt) break;
    const elapsed = minutesBetween(sitting.startedAt, instant);
    const minimum =
      completedForeground +
      Math.max(0, elapsed - sitting.backgroundOpenMinutes);
    const maximum =
      completedForeground + Math.min(elapsed, sitting.foregroundActiveMinutes);
    if (
      value < minimum - MINUTE_TOLERANCE ||
      value > maximum + MINUTE_TOLERANCE
    )
      throw new Error(`${label} is impossible at its timestamp`);
    return;
  }
  throw new Error(`${label} does not occur in a page-open sitting`);
}

function requireNonEmptyString(value, label) {
  if (!isNonEmptyString(value))
    throw new Error(`${label} must be a non-empty string`);
}

function assertExactKeys(value, allowed, label) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0)
    throw new Error(`${label}: unexpected field ${unexpected[0]}`);
  const missing = allowed.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (missing.length > 0)
    throw new Error(`${label}: missing field ${missing[0]}`);
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

function validateExpectedReleaseBinding(expected) {
  const optionByKey = Object.fromEntries(
    RELEASE_BINDING_OPTIONS.map(([prefix, key]) => [key, prefix.slice(0, -1)]),
  );
  const missing = Object.keys(optionByKey).filter(
    (key) => !isNonEmptyString(expected?.[key]),
  );
  if (missing.length > 0)
    throw new Error(
      `release gate requires explicit ${missing.map((key) => optionByKey[key]).join(", ")}`,
    );
  if (!GIT_REVISION.test(expected.revision))
    throw new Error(
      "--expected-revision must be an exact 40-character lowercase Git SHA",
    );
  if (!PRODUCTION_ARTIFACT_ID.test(expected.artifactId))
    throw new Error(
      "--expected-artifact-id must be sha256 followed by 64 lowercase hexadecimal characters",
    );
  if (!MODE_POLICIES.includes(expected.modePolicy))
    throw new Error("--expected-mode-policy is invalid");
  return expected;
}

function assertUniqueCliOption(seenOptions, option) {
  if (seenOptions.has(option)) throw new Error(`duplicate argument: ${option}`);
  seenOptions.add(option);
}

export function runPlaytestCli(
  arguments_ = process.argv.slice(2),
  output = { stdout: process.stdout, stderr: process.stderr },
) {
  const options = parsePlaytestCliArguments(arguments_);
  if (options.help) {
    output.stdout.write(PLAYTEST_CLI_HELP);
    return 0;
  }
  const sessions = loadPlaytestSessions(options.input);
  const releaseEligible = options.expected
    ? validatePlaytestReleaseBinding(sessions, options.expected)
    : sessions.filter((session) => session.experienceStatus === "first-time");
  output.stdout.write(
    `${JSON.stringify(summarizePlaytests(sessions), null, 2)}\n`,
  );
  if (releaseEligible.length < options.required) {
    const exploratory = sessions.length - releaseEligible.length;
    output.stderr.write(
      `playtest evidence: ${releaseEligible.length}/${options.required} qualifying first-time same-candidate sessions recorded; ${exploratory} exploratory sessions excluded\n`,
    );
    return 1;
  }
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = runPlaytestCli();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 2;
  }
}
