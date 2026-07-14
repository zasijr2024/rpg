export interface GateCommand {
  id: string;
  command: string;
}

export interface ReleaseGate {
  id: string;
  label: string;
  description: string;
  inherits: string[];
  requiredPackages: string[];
  checks: string[];
  commands: GateCommand[];
}

export interface ReleaseGateConfig {
  schemaVersion: number;
  gates: ReleaseGate[];
}

export interface GateInputs {
  planning: string;
  checklist: string;
  deviations: string;
  worktreeStatus: string;
}

export function loadGateConfig(projectRoot?: string): ReleaseGateConfig;
export function validateGateGraph(gates: ReleaseGate[]): void;
export function resolveGateLayers(
  config: ReleaseGateConfig,
  gateId: string,
): ReleaseGate[];
export function parsePackageStatuses(markdown: string): Map<string, string>;
export function inspectParityChecklist(
  checklist: string,
  deviations: string,
): {
  unresolved: Array<{ line: number; status: "open" | "partial"; text: string }>;
  deviationsWithoutEvidence: Array<{ line: number; text: string }>;
};
export function inspectStaticGate(
  config: ReleaseGateConfig,
  gateId: string,
  inputs: GateInputs,
): {
  gate: ReleaseGate;
  layers: string[];
  blockers: Array<{ kind: string; id: string; detail: string }>;
  commands: GateCommand[];
};
export function runCommands(
  commands: GateCommand[],
  projectRoot: string,
  dryRun?: boolean,
): Array<GateCommand & { status: string; exitCode?: number }>;
export function main(args?: string[], projectRoot?: string): number;
