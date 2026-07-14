export interface ProductionArtifactFileIdentity {
  path: string;
  bytes: number;
  sha256: string;
}

export interface ProductionArtifactIdentity {
  schemaVersion: 1;
  kind: "adr-production-artifact-identity";
  algorithm: "sha256-tree-v1";
  artifactId: string;
  fileCount: number;
  totalBytes: number;
  files: ProductionArtifactFileIdentity[];
}

export function identifyProductionArtifact(
  directory: string,
): ProductionArtifactIdentity;
