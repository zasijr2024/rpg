import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPrestigeStoreDefinition {
  key: string;
  source: "canonical-manifest";
}

export const originalPrestigeStores: OriginalPrestigeStoreDefinition[] =
  canonicalManifest.keys.prestigeStores.map((key) => ({
    key,
    source: "canonical-manifest"
  }));

