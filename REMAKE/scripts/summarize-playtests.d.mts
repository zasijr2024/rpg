export interface PlaytestSession {
  schemaVersion: 2;
  id: string;
  participantId: string;
  cohortId: string;
  recordedAt: string;
  revision: string;
  ruleset: string;
  experienceStatus: "first-time" | "familiar" | "experienced";
  operatorId: string;
  consentAttested: true;
  unassisted: true;
  environment: {
    artifactKind: "production-build";
    artifactId: string;
    browser: string;
    os: string;
  };
  sittings: Array<{ startedAt: string; activeMinutes: number }>;
  completed: boolean;
  elapsedMinutes: number;
  milestoneMinutes: Record<string, number | null>;
  deathEvents: Array<{ activeMinute: number; phase: string; cause: string }>;
  abandonmentPoint: string | null;
  bottlenecks: Array<{ category: string; participantWords: string }>;
  technicalExceptions: string[];
  exclusions: string[];
}
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
