import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  GameSession,
  type GameLocationKey,
  type WorldEncounterContext,
} from "../engine";
import { EventPanel } from "./EventPanel";
import { OutsideView } from "./OutsideView";
import { PathView } from "./PathView";
import { RoomView } from "./RoomView";
import { SettingsView } from "./SettingsView";
import { SpikeLab } from "./SpikeLab";
import { WorldView } from "./WorldView";

interface TestHarness {
  advance: (ms: number) => void;
  setState: (path: string, value: unknown) => void;
  triggerEvent: () => void;
  triggerEventByKey: (key: string) => void;
  triggerWorldEncounter: (context: WorldEncounterContext) => void;
  triggerWorldSetpiece: (scene: string) => void;
  save: () => void;
  load: () => boolean;
  refresh: () => void;
}

export function App() {
  const session = useMemo(() => new GameSession(), []);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const showSpikes = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("spikes") === "1";
  }, []);
  const testHarnessEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get("testHarness") === "1"
    );
  }, []);
  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  }, []);
  const [saveStatus, setSaveStatus] = useState("idle");
  const gameSnapshot = session.snapshot();
  const snapshot = gameSnapshot.room;
  const outsideSnapshot = gameSnapshot.outside;
  const pathSnapshot = gameSnapshot.path;
  const worldSnapshot = gameSnapshot.world;
  const eventSnapshot = gameSnapshot.event;
  const settingsSnapshot = gameSnapshot.settings;
  const activeLocation =
    !debugEnabled && gameSnapshot.location === "settings"
      ? "room"
      : gameSnapshot.location;
  const refreshGameView = useCallback(() => {
    session.update();
    refresh();
  }, [session]);
  const selectLocation = useCallback(
    (location: GameLocationKey) => {
      if (location === "settings" && !debugEnabled) return;
      session.setLocation(location);
      refresh();
    },
    [debugEnabled, session],
  );

  useEffect(() => {
    refreshGameView();
    if (testHarnessEnabled) return undefined;
    session.start(refresh);
    return () => session.stop();
  }, [refreshGameView, session, testHarnessEnabled]);

  useEffect(() => {
    if (!testHarnessEnabled || typeof window === "undefined") return undefined;
    const harness: TestHarness = {
      advance: (ms) => {
        session.advanceForTest(ms);
        refresh();
      },
      setState: (path, value) => {
        session.setStateForTest(path, value);
        refresh();
      },
      triggerEvent: () => {
        session.triggerEventForTest();
        refresh();
      },
      triggerEventByKey: (key) => {
        session.triggerEventByKeyForTest(key);
        refresh();
      },
      triggerWorldEncounter: (context) => {
        session.triggerWorldEncounter(context);
        refresh();
      },
      triggerWorldSetpiece: (scene) => {
        session.triggerWorldSetpiece(scene);
        refresh();
      },
      save: () => {
        session.saveDevState();
        refresh();
      },
      load: () => {
        const loaded = session.loadDevState();
        refresh();
        return loaded;
      },
      refresh: refreshGameView,
    };
    (window as Window & { __adrTest?: TestHarness }).__adrTest = harness;
    return () => {
      delete (window as Window & { __adrTest?: TestHarness }).__adrTest;
    };
  }, [refreshGameView, session, testHarnessEnabled]);

  return (
    <main className="appShell" aria-label="A Dark Room">
      <nav className="locationTabs" role="tablist" aria-label="locations">
        <button
          type="button"
          role="tab"
          aria-selected={activeLocation === "room"}
          onClick={() => selectLocation("room")}
        >
          {snapshot.title}
        </button>
        {outsideSnapshot.unlocked && (
          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === "outside"}
            onClick={() => selectLocation("outside")}
          >
            {outsideSnapshot.title}
          </button>
        )}
        {pathSnapshot.unlocked && (
          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === "path"}
            onClick={() => selectLocation("path")}
          >
            {pathSnapshot.title}
          </button>
        )}
        {worldSnapshot.active && (
          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === "world"}
            onClick={() => selectLocation("world")}
          >
            world
          </button>
        )}
        {debugEnabled && (
          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === "settings"}
            onClick={() => selectLocation("settings")}
          >
            settings
          </button>
        )}
      </nav>

      {activeLocation === "room" ? (
        <RoomView
          snapshot={snapshot}
          compassDirection={pathSnapshot.compassDirection}
          onLightFire={() => {
            session.lightFire();
            refresh();
          }}
          onStokeFire={() => {
            session.stokeFire();
            refresh();
          }}
          onBuild={(key) => {
            session.build(key);
            refresh();
          }}
          onBuy={(key) => {
            session.buy(key);
            refresh();
          }}
        />
      ) : activeLocation === "outside" ? (
        <OutsideView
          snapshot={outsideSnapshot}
          roomSnapshot={snapshot}
          compassDirection={pathSnapshot.compassDirection}
          onGatherWood={() => {
            session.gatherWood();
            refresh();
          }}
          onCheckTraps={() => {
            session.checkTraps();
            refresh();
          }}
          onIncreaseWorker={(worker, amount) => {
            session.increaseWorker(worker, amount);
            refresh();
          }}
          onDecreaseWorker={(worker, amount) => {
            session.decreaseWorker(worker, amount);
            refresh();
          }}
        />
      ) : activeLocation === "path" ? (
        <PathView
          snapshot={pathSnapshot}
          roomSnapshot={snapshot}
          onIncreaseSupply={(key, amount) => {
            session.increaseSupply(key, amount);
            refresh();
          }}
          onDecreaseSupply={(key, amount) => {
            session.decreaseSupply(key, amount);
            refresh();
          }}
          onEmbark={() => {
            session.embark();
            refresh();
          }}
        />
      ) : activeLocation === "world" ? (
        <WorldView
          snapshot={worldSnapshot}
          onMove={(direction) => {
            session.moveWorld(direction);
            refresh();
          }}
          onEnterLandmark={() => {
            session.enterWorldLandmark();
            refresh();
          }}
          onReturnHome={() => {
            session.returnFromWorld();
            refresh();
          }}
        />
      ) : (
        <SettingsView
          settings={settingsSnapshot}
          location={activeLocation}
          room={snapshot}
          outside={outsideSnapshot}
          saveStatus={saveStatus}
          onToggleSpeedX10={(enabled) => {
            session.setDebugSpeedX10(enabled);
            refresh();
          }}
          onToggleIncomeX10={(enabled) => {
            session.setDebugIncomeX10(enabled);
            refresh();
          }}
          onSave={() => {
            session.saveDevState();
            setSaveStatus("saved");
            refresh();
          }}
          onLoad={() => {
            setSaveStatus(session.loadDevState() ? "loaded" : "empty");
            refresh();
          }}
          onClear={() => {
            session.clearDevState();
            setSaveStatus("cleared");
            refresh();
          }}
        />
      )}
      <EventPanel
        event={eventSnapshot}
        onChoose={(key) => {
          session.chooseEventButton(key);
          refresh();
        }}
        onCombatAction={(key) => {
          session.chooseEventCombatAction(key);
          refresh();
        }}
        onLootAction={(key) => {
          session.chooseEventLootAction(key);
          refresh();
        }}
      />
      {showSpikes && <SpikeLab />}
    </main>
  );
}
