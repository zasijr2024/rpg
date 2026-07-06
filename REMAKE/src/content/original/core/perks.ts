import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPerkDefinition {
  key: string;
  source: "canonical-manifest";
}

export const originalPerks: OriginalPerkDefinition[] =
  canonicalManifest.keys.perks.map((key) => ({
    key,
    source: "canonical-manifest"
  }));

