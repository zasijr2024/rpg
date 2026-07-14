import { describe, expect, it } from "vitest";
import {
  summarizePlaytests,
  validatePlaytestCohort,
  validatePlaytestSession,
} from "../../../scripts/summarize-playtests.mjs";

const revision = "0123456789abcdef0123456789abcdef01234567";
const completed = {
  schemaVersion: 2,
  id: "session-a",
  participantId: "participant-a",
  cohortId: "cohort-a",
  recordedAt: "2026-07-11T18:00:00.000Z",
  revision,
  ruleset: "original",
  experienceStatus: "first-time",
  operatorId: "operator-a",
  consentAttested: true,
  unassisted: true,
  environment: {
    artifactKind: "production-build",
    artifactId: "sha256:artifact-a",
    browser: "Chromium 140",
    os: "Windows 11",
  },
  sittings: [{ startedAt: "2026-07-11T18:00:00.000Z", activeMinutes: 720 }],
  completed: true,
  elapsedMinutes: 720,
  milestoneMinutes: {
    opening: 1,
    compass: 500,
    firstExpedition: 520,
    deepEconomy: 600,
    executioner: 650,
    ship: 690,
    space: 710,
    completion: 720,
  },
  deathEvents: [
    { activeMinute: 550, phase: "firstExpedition", cause: "starvation" },
    { activeMinute: 670, phase: "executioner", cause: "combat" },
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
  it("rejects coached, malformed, excluded, or internally inconsistent records", () => {
    expect(() =>
      validatePlaytestSession({ ...completed, unassisted: false }),
    ).toThrow("genuinely unassisted");
    expect(() =>
      validatePlaytestSession({ ...completed, revision: "abc123" }),
    ).toThrow("exact 40-character Git SHA");
    expect(() =>
      validatePlaytestSession({ ...completed, elapsedMinutes: 719 }),
    ).toThrow("summed active");
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
          revision: "abcdef0123456789abcdef0123456789abcdef01",
        }),
      ]),
    ).toThrow("mixed cohort");
  });

  it("summarizes completion, deaths, milestones, abandonment, and bottlenecks", () => {
    const failed = validatePlaytestSession({
      ...completed,
      id: "session-b",
      participantId: "participant-b",
      completed: false,
      sittings: [{ startedAt: "2026-07-12T18:00:00.000Z", activeMinutes: 180 }],
      elapsedMinutes: 180,
      milestoneMinutes: {
        opening: 2,
        compass: 178,
        firstExpedition: null,
        deepEconomy: null,
        executioner: null,
        ship: null,
        space: null,
        completion: null,
      },
      deathEvents: [
        { activeMinute: 170, phase: "compass", cause: "starvation" },
      ],
      abandonmentPoint: "waiting for leather",
      bottlenecks: [
        { category: "cloth", participantWords: "still waiting for cloth" },
      ],
    });
    expect(
      summarizePlaytests([validatePlaytestSession(completed), failed]),
    ).toMatchObject({
      cohort: { id: "cohort-a", revision, ruleset: "original" },
      sessions: 2,
      completed: 1,
      completionRate: 0.5,
      totalDeaths: 3,
      completionMinutes: { min: 720, median: 720, p90: 720, max: 720 },
      abandonmentPoints: ["waiting for leather"],
      bottlenecks: [
        { label: "cloth", count: 2 },
        { label: "steel", count: 1 },
      ],
    });
  });
});
