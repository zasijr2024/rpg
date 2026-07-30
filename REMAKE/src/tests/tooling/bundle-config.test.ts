import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import progressionConfig from "../../../vitest.progression.config";

const viteConfig = readFileSync(
  resolve(process.cwd(), "vite.config.ts"),
  "utf8",
);

function functionSource(name: string, nextName: string): string {
  const start = viteConfig.indexOf(`function ${name}`);
  const end = viteConfig.indexOf(`function ${nextName}`, start);
  if (start < 0 || end < 0) {
    throw new Error(`Could not isolate ${name} in vite.config.ts`);
  }
  return viteConfig.slice(start, end);
}

describe("production bundle transform integrity", () => {
  it("rewrites retry imports before content hashes are finalized", () => {
    const retryPlugin = functionSource(
      "emitFreshRouteRetryEntries",
      "poolEventCatalogStrings",
    );

    expect(retryPlugin).toContain("renderChunk(code, chunk)");
    expect(retryPlugin).not.toContain("generateBundle");
    expect(retryPlugin).toContain(
      "`import(${quote}${specifier}${ROUTE_RETRY_SUFFIX}${quote})`",
    );
  });

  it("versions the post-hash event-catalog pooling transform", () => {
    const catalogPlugin = viteConfig.slice(
      viteConfig.indexOf("function poolEventCatalogStrings"),
    );

    expect(viteConfig).toContain(
      'const EVENT_CATALOG_POOL_HASH_VERSION = "adr-event-catalog-string-pool-v1";',
    );
    expect(catalogPlugin).toContain("augmentChunkHash(chunk)");
    expect(catalogPlugin).toContain("return EVENT_CATALOG_POOL_HASH_VERSION");
    expect(catalogPlugin).toContain("generateBundle(_options, bundle)");
  });
});

describe("isolated test configuration integrity", () => {
  it("enables runtime state capabilities for the progression study", () => {
    const define = (
      progressionConfig as {
        define?: Record<string, string>;
      }
    ).define;

    expect(define?.__ADR_DEV_SURFACES__).toBe(JSON.stringify(true));
    expect(viteConfig).toContain(
      'const devSurfacesEnabled = command === "serve";',
    );
    expect(viteConfig).toContain(
      "__ADR_DEV_SURFACES__: JSON.stringify(devSurfacesEnabled)",
    );
  });
});
