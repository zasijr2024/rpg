import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import ts from "typescript";

export const SOURCE_BASELINE = Object.freeze({
  repository: "https://github.com/doublespeakgames/adarkroom",
  commit: "1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7",
  committedAt: "2025-05-23T11:33:06-04:00",
});

const printer = ts.createPrinter({ removeComments: true });

function normalizePath(path) {
  return path.replaceAll("\\", "/");
}

function propertyName(name) {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  if (
    ts.isComputedPropertyName(name) &&
    (ts.isStringLiteral(name.expression) ||
      ts.isNumericLiteral(name.expression))
  ) {
    return name.expression.text;
  }
  return undefined;
}

function property(object, name) {
  return object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      propertyName(candidate.name) === name,
  );
}

function objectProperty(object, name) {
  const candidate = property(object, name);
  return candidate && ts.isObjectLiteralExpression(candidate.initializer)
    ? candidate.initializer
    : undefined;
}

function expressionText(expression, sourceFile) {
  return printer
    .printNode(ts.EmitHint.Expression, expression, sourceFile)
    .replaceAll("\r\n", "\n")
    .trim();
}

function translatedText(expression) {
  if (ts.isStringLiteralLike(expression)) return expression.text;
  if (
    ts.isCallExpression(expression) &&
    expression.arguments.length > 0 &&
    ts.isStringLiteralLike(expression.arguments[0])
  ) {
    return expression.arguments[0].text;
  }
  return undefined;
}

function sourceLocation(sourceFile, node, file) {
  const start = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return { file, line: start.line + 1, column: start.character + 1 };
}

function idSegment(value) {
  const segment = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
  return segment || "UNNAMED";
}

function pad(value, width = 3) {
  return String(value).padStart(width, "0");
}

function objectEntries(object) {
  return object.properties.flatMap((candidate) => {
    if (!ts.isPropertyAssignment(candidate)) return [];
    const key = propertyName(candidate.name);
    return key === undefined ? [] : [{ key, property: candidate }];
  });
}

function assignmentCollection(node) {
  if (
    !ts.isBinaryExpression(node) ||
    node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
    !ts.isPropertyAccessExpression(node.left) ||
    !ts.isIdentifier(node.left.expression) ||
    node.left.expression.text !== "Events"
  ) {
    return undefined;
  }
  if (
    !ts.isArrayLiteralExpression(node.right) &&
    !ts.isObjectLiteralExpression(node.right)
  ) {
    return undefined;
  }
  return { name: node.left.name.text, value: node.right };
}

function eventDefinitions(sourceFile) {
  const definitions = [];
  function visit(node) {
    const collection = assignmentCollection(node);
    if (collection) {
      if (ts.isArrayLiteralExpression(collection.value)) {
        collection.value.elements.forEach((element, index) => {
          if (ts.isObjectLiteralExpression(element)) {
            definitions.push({
              collection: collection.name,
              key: pad(index + 1),
              object: element,
            });
          }
        });
      } else {
        for (const entry of objectEntries(collection.value)) {
          if (ts.isObjectLiteralExpression(entry.property.initializer)) {
            definitions.push({
              collection: collection.name,
              key: entry.key,
              object: entry.property.initializer,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return definitions;
}

function addEdge(edges, from, to, relation) {
  edges.push({ from, to, relation });
}

function addEffectRequirements({
  object,
  excluded,
  ownerId,
  sourceFile,
  file,
  requirements,
  edges,
}) {
  let ordinal = 0;
  for (const entry of objectEntries(object)) {
    if (excluded.has(entry.key)) continue;
    ordinal += 1;
    const id = `${ownerId}-EFFECT-${pad(ordinal, 2)}`;
    requirements.push({
      id,
      kind: "effect",
      ownerId,
      effect: entry.key,
      expression: expressionText(entry.property.initializer, sourceFile),
      source: sourceLocation(sourceFile, entry.property, file),
    });
    addEdge(edges, ownerId, id, "contains");
  }
}

function addRewardRequirements({
  object,
  rewardType,
  ownerId,
  sourceFile,
  file,
  requirements,
  edges,
}) {
  if (!object) return;
  let ordinal = 0;
  for (const entry of objectEntries(object)) {
    ordinal += 1;
    const id = `${ownerId}-REWARD-${pad(ordinal, 2)}`;
    requirements.push({
      id,
      kind: "reward",
      ownerId,
      rewardType,
      item: entry.key,
      expression: expressionText(entry.property.initializer, sourceFile),
      source: sourceLocation(sourceFile, entry.property, file),
    });
    addEdge(edges, ownerId, id, "contains");
  }
}

function addCostEffects({
  object,
  ownerId,
  sourceFile,
  file,
  requirements,
  edges,
  ordinalStart,
}) {
  if (!object) return ordinalStart;
  let ordinal = ordinalStart;
  for (const entry of objectEntries(object)) {
    ordinal += 1;
    const id = `${ownerId}-EFFECT-${pad(ordinal, 2)}`;
    requirements.push({
      id,
      kind: "effect",
      ownerId,
      effect: "cost",
      item: entry.key,
      expression: expressionText(entry.property.initializer, sourceFile),
      source: sourceLocation(sourceFile, entry.property, file),
    });
    addEdge(edges, ownerId, id, "contains");
  }
  return ordinal;
}

function transitionTargets(propertyAssignment) {
  const expression = propertyAssignment.initializer;
  if (ts.isStringLiteralLike(expression)) {
    return [{ target: expression.text, probability: 1 }];
  }
  if (!ts.isObjectLiteralExpression(expression)) return [];
  return objectEntries(expression).flatMap((entry) => {
    if (!ts.isStringLiteralLike(entry.property.initializer)) return [];
    const probability = Number(entry.key);
    return [
      {
        target: entry.property.initializer.text,
        probability: Number.isFinite(probability) ? probability : entry.key,
      },
    ];
  });
}

export function parseEventSources(sourceFiles) {
  const requirements = [];
  const edges = [];
  const pendingTransitions = [];
  const sceneIds = new Map();
  const eventIds = new Map();
  const parsedFiles = [];

  for (const source of [...sourceFiles].sort((a, b) =>
    a.file.localeCompare(b.file),
  )) {
    const file = normalizePath(source.file);
    const sourceFile = ts.createSourceFile(
      file,
      source.source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    if (sourceFile.parseDiagnostics.length > 0) {
      const messages = sourceFile.parseDiagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
      throw new Error(`Unable to parse ${file}: ${messages.join("; ")}`);
    }
    parsedFiles.push(file);

    for (const definition of eventDefinitions(sourceFile)) {
      const eventStem = `${idSegment(definition.collection)}-${idSegment(definition.key)}`;
      const eventId = `ADR-EVENT-${eventStem}`;
      const titleProperty = property(definition.object, "title");
      const title = titleProperty
        ? translatedText(titleProperty.initializer)
        : undefined;
      const eventRequirement = {
        id: eventId,
        kind: "event",
        collection: definition.collection,
        key: definition.key,
        ...(title === undefined ? {} : { title }),
        source: sourceLocation(sourceFile, definition.object, file),
      };
      requirements.push(eventRequirement);
      eventIds.set(definition.key, eventId);

      addEffectRequirements({
        object: definition.object,
        excluded: new Set(["title", "scenes", "audio"]),
        ownerId: eventId,
        sourceFile,
        file,
        requirements,
        edges,
      });

      const scenes = objectProperty(definition.object, "scenes");
      if (!scenes) continue;
      for (const sceneEntry of objectEntries(scenes)) {
        if (!ts.isObjectLiteralExpression(sceneEntry.property.initializer)) {
          continue;
        }
        const scene = sceneEntry.property.initializer;
        const sceneId = `ADR-SCENE-${eventStem}-${idSegment(sceneEntry.key)}`;
        requirements.push({
          id: sceneId,
          kind: "scene",
          eventId,
          key: sceneEntry.key,
          source: sourceLocation(sourceFile, sceneEntry.property, file),
        });
        sceneIds.set(`${eventId}\0${sceneEntry.key}`, sceneId);
        addEdge(edges, eventId, sceneId, "contains");

        addEffectRequirements({
          object: scene,
          excluded: new Set([
            "text",
            "notification",
            "buttons",
            "loot",
            "reward",
          ]),
          ownerId: sceneId,
          sourceFile,
          file,
          requirements,
          edges,
        });
        addRewardRequirements({
          object: objectProperty(scene, "loot"),
          rewardType: "loot",
          ownerId: sceneId,
          sourceFile,
          file,
          requirements,
          edges,
        });
        addRewardRequirements({
          object: objectProperty(scene, "reward"),
          rewardType: "reward",
          ownerId: sceneId,
          sourceFile,
          file,
          requirements,
          edges,
        });

        const buttons = objectProperty(scene, "buttons");
        if (!buttons) continue;
        for (const buttonEntry of objectEntries(buttons)) {
          if (!ts.isObjectLiteralExpression(buttonEntry.property.initializer)) {
            continue;
          }
          const button = buttonEntry.property.initializer;
          const buttonId = `ADR-BUTTON-${eventStem}-${idSegment(sceneEntry.key)}-${idSegment(buttonEntry.key)}`;
          requirements.push({
            id: buttonId,
            kind: "button",
            sceneId,
            key: buttonEntry.key,
            source: sourceLocation(sourceFile, buttonEntry.property, file),
          });
          addEdge(edges, sceneId, buttonId, "contains");

          const excludedButtonProperties = new Set([
            "text",
            "notification",
            "nextScene",
            "nextEvent",
            "reward",
            "cost",
          ]);
          addEffectRequirements({
            object: button,
            excluded: excludedButtonProperties,
            ownerId: buttonId,
            sourceFile,
            file,
            requirements,
            edges,
          });
          const existingEffects = requirements.filter(
            (requirement) =>
              requirement.kind === "effect" && requirement.ownerId === buttonId,
          ).length;
          addCostEffects({
            object: objectProperty(button, "cost"),
            ownerId: buttonId,
            sourceFile,
            file,
            requirements,
            edges,
            ordinalStart: existingEffects,
          });
          addRewardRequirements({
            object: objectProperty(button, "reward"),
            rewardType: "reward",
            ownerId: buttonId,
            sourceFile,
            file,
            requirements,
            edges,
          });

          for (const [propertyKey, targetKind] of [
            ["nextScene", "scene"],
            ["nextEvent", "event"],
          ]) {
            const transitionProperty = property(button, propertyKey);
            if (!transitionProperty) continue;
            transitionTargets(transitionProperty).forEach((target, index) => {
              const transitionId = `${buttonId}-TRANSITION-${pad(index + 1, 2)}`;
              requirements.push({
                id: transitionId,
                kind: "transition",
                buttonId,
                targetKind,
                target: target.target,
                probability: target.probability,
                source: sourceLocation(sourceFile, transitionProperty, file),
              });
              addEdge(edges, buttonId, transitionId, "contains");
              pendingTransitions.push({
                id: transitionId,
                eventId,
                targetKind,
                target: target.target,
              });
            });
          }
        }
      }
    }
  }

  const unresolvedTransitions = [];
  for (const transition of pendingTransitions) {
    if (transition.targetKind === "scene" && transition.target === "end") {
      continue;
    }
    const targetId =
      transition.targetKind === "scene"
        ? sceneIds.get(`${transition.eventId}\0${transition.target}`)
        : eventIds.get(transition.target);
    if (targetId) {
      addEdge(edges, transition.id, targetId, "transitions-to");
    } else {
      unresolvedTransitions.push({
        transitionId: transition.id,
        targetKind: transition.targetKind,
        target: transition.target,
      });
    }
  }

  const idCounts = new Map();
  for (const requirement of requirements) {
    idCounts.set(requirement.id, (idCounts.get(requirement.id) ?? 0) + 1);
  }
  const duplicateRequirementIds = [...idCounts]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const counts = Object.fromEntries(
    ["event", "scene", "button", "transition", "effect", "reward"].map(
      (kind) => [
        `${kind}s`,
        requirements.filter((requirement) => requirement.kind === kind).length,
      ],
    ),
  );

  return {
    schemaVersion: 1,
    source: SOURCE_BASELINE,
    files: parsedFiles,
    summary: {
      ...counts,
      requirements: requirements.length,
      edges: edges.length,
    },
    requirements,
    edges,
    diagnostics: { duplicateRequirementIds, unresolvedTransitions },
  };
}

function walkFiles(directory) {
  if (!statSync(directory).isDirectory()) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function lineCount(source) {
  if (source.length === 0) return 0;
  return (
    source.replace(/\r\n/g, "\n").split("\n").length -
    (source.endsWith("\n") ? 1 : 0)
  );
}

function matches(source, pattern, group = 1) {
  return [...source.matchAll(pattern)].map((match) => match[group]);
}

function unique(values) {
  return [...new Set(values)];
}

function sourceRecord(workspaceRoot, absolutePath) {
  const source = readFileSync(absolutePath);
  const text = source.toString("utf8");
  return {
    path: normalizePath(relative(workspaceRoot, absolutePath)),
    bytes: source.byteLength,
    lines: lineCount(text),
    sha256: createHash("sha256").update(source).digest("hex"),
  };
}

function read(workspaceRoot, relativePath) {
  return readFileSync(resolve(workspaceRoot, relativePath), "utf8");
}

export function buildArtifacts(workspaceRoot) {
  const roots = [
    "ORIGINAL/script",
    "ORIGINAL/css",
    "ORIGINAL/lang",
    "ORIGINAL/doc",
  ];
  const individualFiles = [
    "ORIGINAL/index.html",
    "ORIGINAL/browserWarning.html",
    "ORIGINAL/mobileWarning.html",
    "ORIGINAL/package.json",
    "ORIGINAL/README.md",
    "ORIGINAL/LICENSE.md",
  ];
  const allFiles = new Map();
  for (const root of roots) {
    for (const file of walkFiles(resolve(workspaceRoot, root))) {
      allFiles.set(normalizePath(relative(workspaceRoot, file)), file);
    }
  }
  for (const file of individualFiles) {
    const absolute = resolve(workspaceRoot, file);
    allFiles.set(normalizePath(file), absolute);
  }
  const files = [...allFiles.values()]
    .map((file) => sourceRecord(workspaceRoot, file))
    .sort((a, b) => a.path.localeCompare(b.path));

  const room = read(workspaceRoot, "ORIGINAL/script/room.js");
  const outside = read(workspaceRoot, "ORIGINAL/script/outside.js");
  const world = read(workspaceRoot, "ORIGINAL/script/world.js");
  const path = read(workspaceRoot, "ORIGINAL/script/path.js");
  const fabricator = read(workspaceRoot, "ORIGINAL/script/fabricator.js");
  const engine = read(workspaceRoot, "ORIGINAL/script/engine.js");
  const prestige = read(workspaceRoot, "ORIGINAL/script/prestige.js");
  const audio = read(workspaceRoot, "ORIGINAL/script/audioLibrary.js");
  const eventPaths = files
    .map((file) => file.path)
    .filter((file) => /^ORIGINAL\/script\/events\/[^/]+\.js$/.test(file));
  const eventSources = eventPaths.map((file) => ({
    file,
    source: read(workspaceRoot, file),
  }));
  const parityGraph = parseEventSources(eventSources);
  const eventRequirements = parityGraph.requirements.filter(
    (requirement) => requirement.kind === "event",
  );

  const canonicalManifest = {
    generatedAt: SOURCE_BASELINE.committedAt,
    source: {
      repository: SOURCE_BASELINE.repository,
      commit: SOURCE_BASELINE.commit,
      localRoot: "ORIGINAL",
    },
    files,
    keys: {
      roomDefinitions: unique(matches(room, /^\s{2,}'([^']+)':\s*\{/gm)),
      workers: unique(matches(outside, /^\s{2,}'([^']+)':\s*\{/gm)),
      weapons: unique(matches(world, /^\s{4}'([^']+)':\s*\{/gm)),
      fabricatorCraftables: unique(
        matches(fabricator, /^\s{4}'([^']+)':\s*\{/gm),
      ),
      perks: unique(matches(engine, /^\s{6}'([^']+)':\s*\{/gm)),
      prestigeStores: unique(matches(prestige, /store:\s*'([^']+)'/g)),
      pathWeightOverrides: unique(matches(path, /^[\t ]+'([^']+)':\s*[0-9]/gm)),
      audioConstants: unique(matches(audio, /^\s{4}([A-Z0-9_]+):/gm)),
      worldTileConstants: unique(
        matches(world, /^\s{4}([A-Z_]+):\s*'[^']+'/gm),
      ),
      worldLandmarkAssignments: unique(
        matches(world, /World\.LANDMARKS\[World\.TILE\.([A-Z_]+)\]/g),
      ),
    },
    events: {
      files: eventPaths,
      titles: eventRequirements
        .filter((event) => event.title !== undefined)
        .map((event) => ({ file: event.source.file, title: event.title })),
    },
  };

  return { canonicalManifest, parityGraph };
}
