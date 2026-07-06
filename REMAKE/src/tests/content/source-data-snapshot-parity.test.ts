import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  originalFabricatorCraftables,
  originalOutsideWorkerIncome,
  originalPathWeightOverrides,
  originalRoomCost,
  originalRoomCraftables,
  originalRoomTradeGoods,
  originalTrapDrops,
  PATH_STORES_OFFSET,
  DEFAULT_BAG_SPACE
} from "../../content/original";

const workspaceRoot = resolve(process.cwd(), "..");

function audioLibraryProxy(): Record<string, string> {
  return new Proxy(
    {},
    {
      get: (_target, property) => String(property)
    }
  ) as Record<string, string>;
}

function evaluateOriginal<T>(
  relativePath: string,
  exposeScript: string,
  extras: Record<string, unknown> = {}
): T {
  const source = readFileSync(join(workspaceRoot, relativePath), "utf8");
  const context = {
    _: (text: string) => text,
    AudioLibrary: audioLibraryProxy(),
    console,
    ...extras
  };

  runInNewContext(`${source}\n${exposeScript}`, context);
  return (context as unknown as Record<string, T>).__export;
}

describe("source-derived data snapshot parity", () => {
  it("matches every room craftable and trade good against ORIGINAL/script/room.js", () => {
    const contextState = { buildings: { trap: 0, hut: 0 } };
    const originalRoom = evaluateOriginal<{
      Craftables: Record<string, any>;
      TradeGoods: Record<string, any>;
    }>("ORIGINAL/script/room.js", "globalThis.__export = Room;", {
      $SM: {
        get: (path: string) => {
          if (path === 'game.buildings["trap"]') return contextState.buildings.trap;
          if (path === 'game.buildings["hut"]') return contextState.buildings.hut;
          return 0;
        }
      }
    });

    expect(originalRoomCraftables.map((item) => item.key)).toEqual(
      Object.keys(originalRoom.Craftables)
    );
    for (const ported of originalRoomCraftables) {
      const source = originalRoom.Craftables[ported.key];
      expect(source).toBeTruthy();
      expect(ported.name).toBe(source.name);
      expect(ported.type).toBe(source.type);
      expect(ported.maximum).toBe(source.maximum);
      expect(ported.availableMsg).toBe(source.availableMsg);
      expect(ported.buildMsg).toBe(source.buildMsg);
      expect(ported.maxMsg).toBe(source.maxMsg);
      expect(ported.audio).toBe(source.audio);

      contextState.buildings.trap = 0;
      contextState.buildings.hut = 0;
      expect(originalRoomCost(ported, { buildings: { trap: 0, hut: 0 } })).toEqual(
        source.cost()
      );
      contextState.buildings.trap = 4;
      contextState.buildings.hut = 4;
      expect(originalRoomCost(ported, { buildings: { trap: 4, hut: 4 } })).toEqual(
        source.cost()
      );
    }

    expect(originalRoomTradeGoods.map((item) => item.key)).toEqual(
      Object.keys(originalRoom.TradeGoods)
    );
    for (const ported of originalRoomTradeGoods) {
      const source = originalRoom.TradeGoods[ported.key];
      expect(source).toBeTruthy();
      expect(ported.type).toBe(source.type);
      expect(ported.maximum).toBe(source.maximum);
      expect(ported.audio).toBe(source.audio);
      expect(ported.cost).toEqual(source.cost());
    }
  });

  it("matches outside income and trap drop tables against ORIGINAL/script/outside.js", () => {
    const originalOutside = evaluateOriginal<{
      _INCOME: Record<string, any>;
      TrapDrops: any[];
    }>("ORIGINAL/script/outside.js", "globalThis.__export = Outside;", {
      $: { extend: Object.assign }
    });

    expect(originalOutsideWorkerIncome).toEqual(
      Object.entries(originalOutside._INCOME).map(([key, value]) => ({
        key,
        name: value.name,
        delay: value.delay,
        stores: value.stores
      }))
    );
    expect(originalTrapDrops).toEqual(originalOutside.TrapDrops);
  });

  it("matches path constants and weights against ORIGINAL/script/path.js", () => {
    const originalPath = evaluateOriginal<{
      DEFAULT_BAG_SPACE: number;
      _STORES_OFFSET: number;
      Weight: Record<string, number>;
    }>("ORIGINAL/script/path.js", "globalThis.__export = Path;");

    expect(DEFAULT_BAG_SPACE).toBe(originalPath.DEFAULT_BAG_SPACE);
    expect(PATH_STORES_OFFSET).toBe(originalPath._STORES_OFFSET);
    expect(originalPathWeightOverrides).toEqual(
      Object.entries(originalPath.Weight).map(([key, weight]) => ({ key, weight }))
    );
  });

  it("matches every fabricator craftable against ORIGINAL/script/fabricator.js", () => {
    const originalFabricator = evaluateOriginal<{
      Craftables: Record<string, any>;
    }>("ORIGINAL/script/fabricator.js", "globalThis.__export = Fabricator;");

    expect(originalFabricatorCraftables.map((item) => item.key)).toEqual(
      Object.keys(originalFabricator.Craftables)
    );
    for (const ported of originalFabricatorCraftables) {
      const source = originalFabricator.Craftables[ported.key];
      expect(source).toBeTruthy();
      expect(ported.name).toBe(source.name);
      expect(ported.type).toBe(source.type);
      expect(ported.maximum).toBe(source.maximum);
      expect(ported.blueprintRequired).toBe(source.blueprintRequired);
      expect(ported.buildMsg).toBe(source.buildMsg);
      expect(ported.quantity).toBe(source.quantity);
      expect(ported.cost).toEqual(source.cost());
    }
  });
});
