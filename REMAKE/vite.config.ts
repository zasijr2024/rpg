import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const PLAIN_TEMPLATE_LITERAL = /`(?:\\[\s\S]|[^\\`])*`/g;
const ROUTE_RETRY_SUFFIX = "?route-retry";
const EVENT_CATALOG_POOL_HASH_VERSION = "adr-event-catalog-string-pool-v1";

function emitFreshRouteRetryEntries(): Plugin {
  return {
    name: "adr-fresh-route-retry-entries",
    apply: "build",
    enforce: "pre",
    transform(_source, id) {
      if (!id.endsWith(ROUTE_RETRY_SUFFIX)) return;
      const originalId = id.slice(0, -ROUTE_RETRY_SUFFIX.length);
      return {
        code: `export const loadRouteRetry = () => import(${JSON.stringify(originalId)});`,
        map: null,
      };
    },
    renderChunk(code, chunk) {
      if (!chunk.facadeModuleId?.endsWith(ROUTE_RETRY_SUFFIX)) return;
      const imports = [...code.matchAll(/\bimport\((["'`])([^"'`]+)\1\)/g)];
      if (imports.length !== 1) {
        throw new Error(
          `${chunk.facadeModuleId} must emit exactly one retry import`,
        );
      }
      const [matched, quote, specifier] = imports[0];
      return {
        code: code.replace(
          matched,
          `import(${quote}${specifier}${ROUTE_RETRY_SUFFIX}${quote})`,
        ),
        map: null,
      };
    },
  };
}
function poolEventCatalogStrings(): Plugin {
  return {
    name: "adr-pool-event-catalog-strings",
    apply: "build",
    augmentChunkHash(chunk) {
      if (chunk.name === "event-catalog") {
        return EVENT_CATALOG_POOL_HASH_VERSION;
      }
    },
    generateBundle(_options, bundle) {
      const catalog = Object.values(bundle).find(
        (entry) => entry.type === "chunk" && entry.name === "event-catalog",
      );
      if (!catalog || catalog.type !== "chunk") {
        throw new Error("event-catalog chunk is missing");
      }

      const literals = catalog.code.match(PLAIN_TEMPLATE_LITERAL) ?? [];
      const counts = new Map<string, number>();
      for (const literal of literals) {
        if (literal.includes("${")) continue;
        counts.set(literal, (counts.get(literal) ?? 0) + 1);
      }

      const pool: string[] = [];
      const references = new Map<string, string>();
      const candidates = [...counts.entries()]
        .filter(([literal, count]) => literal.length >= 6 && count > 1)
        .sort(
          ([left, leftCount], [right, rightCount]) =>
            right.length * (rightCount - 1) - left.length * (leftCount - 1),
        );

      for (const [literal, count] of candidates) {
        const reference = `$e[${pool.length}]`;
        const savedBytes =
          literal.length * count -
          (literal.length + 1 + reference.length * count);
        if (savedBytes <= 0) continue;
        references.set(literal, reference);
        pool.push(literal);
      }

      if (pool.length === 0) {
        throw new Error("event-catalog string pool is empty");
      }
      const codeOutsideStrings = catalog.code.replace(
        PLAIN_TEMPLATE_LITERAL,
        "",
      );
      if (/\$e\b/.test(codeOutsideStrings)) {
        throw new Error("event-catalog string pool identifier collides");
      }

      catalog.code = `const $e=[${pool.join(",")}];${catalog.code.replace(
        PLAIN_TEMPLATE_LITERAL,
        (literal) => references.get(literal) ?? literal,
      )}`;
    },
  };
}

export default defineConfig(({ command }) => {
  const devSurfacesEnabled = command === "serve";

  return {
    define: {
      __ADR_DEV_SURFACES__: JSON.stringify(devSurfacesEnabled),
    },
    plugins: [emitFreshRouteRetryEntries(), react(), poolEventCatalogStrings()],
    server: {
      host: "127.0.0.1",
      port: 41730,
      strictPort: true,
    },
    build: {
      manifest: true,
      rolldownOptions: {
        optimization: {
          pifeForModuleWrappers: false,
        },
        output: {
          codeSplitting: {
            groups: [
              {
                name: "event-catalog",
                test: /[\\/]content[\\/]original[\\/]events[\\/]eventData\.ts$/,
                priority: 10,
                includeDependenciesRecursively: false,
              },
            ],
          },
        },
      },
    },
    test: {
      exclude: [
        "node_modules",
        "dist",
        "src/tests/e2e/**",
        "src/tests/engine/progression-distribution.test.ts",
      ],
      environment: "jsdom",
      globals: true,
    },
  };
});
