export type PlaytestMode = "classic" | "hyper";
export type PlaytestModePolicy =
  "classic-locked" | "hyper-locked" | "timeline-recorded";

export interface PlaytestMilestone {
  reachedAt: string;
  foregroundActiveMinute: number;
  wallMinute: number;
}

export interface PlaytestSession {
  schemaVersion: 3;
  id: string;
  participantId: string;
  cohortId: string;
  recordedAt: string;
  revision: string;
  ruleset: string;
  modePolicy: PlaytestModePolicy;
  modeTimeline: Array<{ at: string; mode: PlaytestMode }>;
  experienceStatus: "first-time" | "familiar" | "experienced";
  operatorId: string;
  consentAttested: true;
  unassisted: true;
  environment: {
    artifactKind: "production-build";
    artifactId: `sha256:${string}`;
    browser: string;
    os: string;
  };
  wallStartedAt: string;
  wallEndedAt: string;
  sittings: Array<{
    startedAt: string;
    endedAt: string;
    foregroundActiveMinutes: number;
    backgroundOpenMinutes: number;
  }>;
  closedPageGaps: Array<{ startedAt: string; endedAt: string }>;
  foregroundActiveMinutes: number;
  backgroundOpenMinutes: number;
  closedPageMinutes: number;
  wallElapsedMinutes: number;
  completed: boolean;
  milestones: Record<string, PlaytestMilestone | null>;
  deathEvents: Array<{
    occurredAt: string;
    foregroundActiveMinute: number;
    wallMinute: number;
    phase: string;
    cause: string;
  }>;
  abandonmentPoint: string | null;
  bottlenecks: Array<{ category: string; participantWords: string }>;
  technicalExceptions: string[];
  exclusions: string[];
}

export interface PlaytestReleaseBinding {
  revision: string;
  artifactId: `sha256:${string}`;
  cohortId: string;
  ruleset: string;
  modePolicy: PlaytestModePolicy;
}

export interface ParsedPlaytestCliArguments {
  help: boolean;
  input: string;
  required: number;
  expected: PlaytestReleaseBinding | null;
}

export const RELEASE_EVIDENCE_MINIMUM: 5;
export const PLAYTEST_CLI_HELP: string;
export function resolvePlaytestEvidenceMinimum(
  requestedMinimum?: number,
): number;
export function validatePlaytestSession(
  value: unknown,
  source?: string,
): PlaytestSession;
export function validatePlaytestCohort(
  sessions: PlaytestSession[],
  source?: string,
): PlaytestSession[];
export function summarizePlaytests(sessions: PlaytestSession[]): unknown;
export function loadPlaytestSessions(path: string): PlaytestSession[];
export function validatePlaytestReleaseBinding(
  sessions: PlaytestSession[],
  expected: PlaytestReleaseBinding,
): PlaytestSession[];
export function parsePlaytestCliArguments(
  arguments_: string[],
): ParsedPlaytestCliArguments;
export function runPlaytestCli(
  arguments_?: string[],
  output?: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream },
): number;
