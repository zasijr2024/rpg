import type { ReleaseGateConfig } from "./release-gates.mjs";

export interface PhaseClosureReport {
  phase: string;
  revision: string;
  tag: string | null;
  worktree: "clean" | "dirty";
  tagMatchesHead: boolean | null;
  phaseOwnedOpenIds: string[];
  gates: Array<{
    id: string;
    label: string;
    status: "READY" | "BLOCKED";
    blockers: Array<{ kind: string; id: string; detail: string }>;
  }>;
  status: "READY" | "PASS" | "BLOCKED";
}

export function phaseOwnedOpenIds(planning: string, phaseId?: string): string[];
export function inspectPhaseClosure(input: {
  phaseId: string;
  revision: string;
  planning: string;
  checklist: string;
  deviations: string;
  worktreeStatus: string;
  gateConfig: ReleaseGateConfig;
  tag?: string;
  tagMatchesHead?: boolean;
}): PhaseClosureReport;
export function main(args?: string[], projectRoot?: string): number;
