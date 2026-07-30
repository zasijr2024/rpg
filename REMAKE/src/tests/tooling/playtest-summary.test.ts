import { describe, expect, it } from "vitest";
import {
  PLAYTEST_CLI_HELP,
  RELEASE_EVIDENCE_MINIMUM,
  parsePlaytestCliArguments,
  resolvePlaytestEvidenceMinimum,
  summarizePlaytests,
  validatePlaytestCohort,
  validatePlaytestReleaseBinding,
  validatePlaytestSession,
} from "../../../scripts/summarize-playtests.mjs";

const revision = "0123456789abcdef0123456789abcdef01234567";
const artifactId = `sha256:${"a".repeat(64)}` as const;
const releaseBinding = {
  revision,
  artifactId,
  cohortId: "cohort-a",
  ruleset: "original",
  modePolicy: "classic-locked",
} as const;
const completed = {
  schemaVersion: 3,
  id: "session-a",
  participantId: "participant-a",
  cohortId: "cohort-a",
  recordedAt: "2026-07-12T09:10:00.000Z",
  revision,
  ruleset: "original",
  modePolicy: "classic-locked",
  modeTimeline: [{ at: "2026-07-11T18:00:00.000Z", mode: "classic" }],
  experienceStatus: "first-time",
  operatorId: "operator-a",
  consentAttested: true,
  unassisted: true,
  environment: {
    artifactKind: "production-build",
    artifactId,
    browser: "Chromium 140",
    os: "Windows 11",
  },
  wallStartedAt: "2026-07-11T18:00:00.000Z",
  wallEndedAt: "2026-07-12T09:00:00.000Z",
  sittings: [
    {
      startedAt: "2026-07-11T18:00:00.000Z",
      endedAt: "2026-07-11T22:00:00.000Z",
      foregroundActiveMinutes: 180,
      backgroundOpenMinutes: 60,
    },
    {
      startedAt: "2026-07-12T00:00:00.000Z",
      endedAt: "2026-07-12T09:00:00.000Z",
      foregroundActiveMinutes: 540,
      backgroundOpenMinutes: 0,
    },
  ],
  closedPageGaps: [
    {
      startedAt: "2026-07-11T22:00:00.000Z",
      endedAt: "2026-07-12T00:00:00.000Z",
    },
  ],
  foregroundActiveMinutes: 720,
  backgroundOpenMinutes: 60,
  closedPageMinutes: 120,
  wallElapsedMinutes: 900,
  completed: true,
  milestones: {
    opening: milestone("2026-07-11T18:01:00.000Z", 1, 1),
    compass: milestone("2026-07-12T05:20:00.000Z", 500, 680),
    firstExpedition: milestone("2026-07-12T05:40:00.000Z", 520, 700),
    deepEconomy: milestone("2026-07-12T07:00:00.000Z", 600, 780),
    executioner: milestone("2026-07-12T07:50:00.000Z", 650, 830),
    ship: milestone("2026-07-12T08:30:00.000Z", 690, 870),
    space: milestone("2026-07-12T08:50:00.000Z", 710, 890),
    completion: milestone("2026-07-12T09:00:00.000Z", 720, 900),
  },
  deathEvents: [
    death("2026-07-12T06:10:00.000Z", 550, 730, "firstExpedition"),
    death("2026-07-12T08:10:00.000Z", 670, 850, "executioner"),
  ],
  abandonmentPoint: null,
  bottlenecks: [
    { category: "cloth", participantWords: "cloth took a long time" },
    { category: "steel", participantWords: "I waited for steel" },
  ],
  technicalExceptions: [],
  exclusions: [],
};

describe("human playtest evidence", () => {
  it("strictly reconciles wall, foreground, background-open, and closed-page time", () => {
    expect(validatePlaytestSession(completed)).toBe(completed);
    expect(() =>
      validatePlaytestSession({ ...completed, schemaVersion: 2 }),
    ).toThrow("schemaVersion must be 3");
    expect(() =>
      validatePlaytestSession({ ...completed, foregroundActiveMinutes: 719 }),
    ).toThrow("does not match timestamp accounting");
    expect(() =>
      validatePlaytestSession({
        ...completed,
        sittings: [
          { ...completed.sittings[0], backgroundOpenMinutes: 59 },
          completed.sittings[1],
        ],
      }),
    ).toThrow("must equal its wall duration");
    expect(() =>
      validatePlaytestSession({ ...completed, closedPageGaps: [] }),
    ).toThrow("explicitly cover every gap");
  });

  it("rejects untracked mode exposure and inconsistent active/wall events", () => {
    expect(() =>
      validatePlaytestSession({
        ...completed,
        modeTimeline: [
          { at: completed.wallStartedAt, mode: "classic" },
          { at: "2026-07-12T06:00:00.000Z", mode: "hyper" },
        ],
      }),
    ).toThrow("classic-locked");
    expect(() =>
      validatePlaytestSession({
        ...completed,
        milestones: {
          ...completed.milestones,
          compass: { ...completed.milestones.compass, wallMinute: 679 },
        },
      }),
    ).toThrow("wallMinute must match reachedAt");
    expect(() =>
      validatePlaytestSession({
        ...completed,
        deathEvents: [
          { ...completed.deathEvents[0], foregroundActiveMinute: 721 },
        ],
      }),
    ).toThrow("foregroundActiveMinute is invalid");

    const switching = validatePlaytestSession({
      ...completed,
      modePolicy: "timeline-recorded",
      modeTimeline: [
        { at: completed.wallStartedAt, mode: "classic" },
        { at: "2026-07-12T06:00:00.000Z", mode: "hyper" },
        { at: "2026-07-12T07:00:00.000Z", mode: "classic" },
      ],
    });
    expect(switching.modeTimeline).toHaveLength(3);
  });

  it("rejects coached, malformed, excluded, or privacy-expanding records", () => {
    expect(() =>
      validatePlaytestSession({ ...completed, unassisted: false }),
    ).toThrow("genuinely unassisted");
    expect(() =>
      validatePlaytestSession({ ...completed, revision: "abc123" }),
    ).toThrow("exact 40-character Git SHA");
    expect(() =>
      validatePlaytestSession({
        ...completed,
        environment: {
          ...completed.environment,
          artifactId: `sha256:${"A".repeat(64)}`,
        },
      }),
    ).toThrow("64 lowercase hexadecimal characters");
    expect(() =>
      validatePlaytestSession({ ...completed, exclusions: ["coached"] }),
    ).toThrow("do not qualify");
    expect(() =>
      validatePlaytestSession({
        ...completed,
        participantName: "private data",
      }),
    ).toThrow("unexpected field");
    expect(() =>
      validatePlaytestSession({ ...completed, abandonmentPoint: "left early" }),
    ).toThrow("completed sessions");
  });

  it("rejects duplicate participants and mixed decision cohorts", () => {
    expect(() =>
      validatePlaytestCohort([
        validatePlaytestSession(completed),
        validatePlaytestSession({ ...completed, id: "session-b" }),
      ]),
    ).toThrow("duplicate participant");
    expect(() =>
      validatePlaytestCohort([
        validatePlaytestSession(completed),
        validatePlaytestSession({
          ...completed,
          id: "session-b",
          participantId: "participant-b",
          modePolicy: "timeline-recorded",
        }),
      ]),
    ).toThrow("mixed cohort");
  });

  it("summarizes foreground-active and wall milestone distributions separately", () => {
    const failed = validatePlaytestSession({
      ...completed,
      id: "session-b",
      participantId: "participant-b",
      recordedAt: "2026-07-12T21:05:00.000Z",
      wallStartedAt: "2026-07-12T18:00:00.000Z",
      wallEndedAt: "2026-07-12T21:00:00.000Z",
      modeTimeline: [{ at: "2026-07-12T18:00:00.000Z", mode: "classic" }],
      sittings: [
        {
          startedAt: "2026-07-12T18:00:00.000Z",
          endedAt: "2026-07-12T21:00:00.000Z",
          foregroundActiveMinutes: 180,
          backgroundOpenMinutes: 0,
        },
      ],
      closedPageGaps: [],
      foregroundActiveMinutes: 180,
      backgroundOpenMinutes: 0,
      closedPageMinutes: 0,
      wallElapsedMinutes: 180,
      completed: false,
      milestones: {
        opening: milestone("2026-07-12T18:02:00.000Z", 2, 2),
        compass: milestone("2026-07-12T20:58:00.000Z", 178, 178),
        firstExpedition: null,
        deepEconomy: null,
        executioner: null,
        ship: null,
        space: null,
        completion: null,
      },
      deathEvents: [death("2026-07-12T20:50:00.000Z", 170, 170, "compass")],
      abandonmentPoint: "waiting for leather",
      bottlenecks: [
        { category: "cloth", participantWords: "still waiting for cloth" },
      ],
    });
    expect(
      summarizePlaytests([validatePlaytestSession(completed), failed]),
    ).toMatchObject({
      cohort: {
        id: "cohort-a",
        revision,
        ruleset: "original",
        modePolicy: "classic-locked",
      },
      releaseEvidence: {
        minimumSessions: 5,
        qualifyingFirstTimeSessions: 2,
        exploratorySessionsExcludedFromGate: 0,
        minimumMet: false,
      },
      sessions: 2,
      completed: 1,
      completionRate: 0.5,
      totalDeaths: 3,
      completionMinutes: {
        foregroundActive: { min: 720, median: 720, p90: 720, max: 720 },
        wall: { min: 900, median: 900, p90: 900, max: 900 },
      },
      milestoneMinutes: {
        compass: {
          foregroundActive: { min: 178, max: 500 },
          wall: { min: 178, max: 680 },
        },
      },
      modeExposure: {
        classicOnlySessions: 2,
        hyperExposedSessions: 0,
        recordedTransitions: 0,
      },
      abandonmentPoints: ["waiting for leather"],
      bottlenecks: [
        { label: "cloth", count: 2 },
        { label: "steel", count: 1 },
      ],
    });
  });

  it("enforces five sessions as the release-evidence floor", () => {
    expect(RELEASE_EVIDENCE_MINIMUM).toBe(5);
    expect(resolvePlaytestEvidenceMinimum()).toBe(0);
    expect(resolvePlaytestEvidenceMinimum(3)).toBe(5);
    expect(resolvePlaytestEvidenceMinimum(5)).toBe(5);
    expect(resolvePlaytestEvidenceMinimum(8)).toBe(8);
    expect(() => resolvePlaytestEvidenceMinimum(2.5)).toThrow(
      "non-negative integer",
    );
  });

  it("includes exploratory sessions in summaries but excludes them from the release count", () => {
    const exploratory = validatePlaytestSession({
      ...completed,
      id: "session-exploratory",
      participantId: "participant-exploratory",
      experienceStatus: "experienced",
    });

    expect(
      summarizePlaytests([validatePlaytestSession(completed), exploratory]),
    ).toMatchObject({
      sessions: 2,
      releaseEvidence: {
        qualifyingFirstTimeSessions: 1,
        exploratorySessionsExcludedFromGate: 1,
        minimumMet: false,
      },
    });
    expect(
      validatePlaytestReleaseBinding(
        [validatePlaytestSession(completed), exploratory],
        releaseBinding,
      ),
    ).toEqual([completed]);
  });

  it("requires complete CLI candidate binding and rejects mismatches", () => {
    expect(() => parsePlaytestCliArguments(["--require=5"])).toThrow(
      "release gate requires explicit --expected-revision",
    );
    expect(
      parsePlaytestCliArguments([
        "playtests/sessions",
        "--require=5",
        `--expected-revision=${revision}`,
        `--expected-artifact-id=${artifactId}`,
        "--expected-cohort-id=cohort-a",
        "--expected-ruleset=original",
        "--expected-mode-policy=classic-locked",
      ]),
    ).toMatchObject({
      input: "playtests/sessions",
      required: 5,
      expected: releaseBinding,
    });
    expect(() =>
      validatePlaytestReleaseBinding([validatePlaytestSession(completed)], {
        ...releaseBinding,
        revision: "f".repeat(40),
      }),
    ).toThrow("release gate revision mismatch");
    expect(PLAYTEST_CLI_HELP).toContain("counts only first-time participants");
  });
});

function milestone(
  reachedAt: string,
  foregroundActiveMinute: number,
  wallMinute: number,
) {
  return { reachedAt, foregroundActiveMinute, wallMinute };
}

function death(
  occurredAt: string,
  foregroundActiveMinute: number,
  wallMinute: number,
  phase: string,
) {
  return {
    occurredAt,
    foregroundActiveMinute,
    wallMinute,
    phase,
    cause: "observed cause",
  };
}
