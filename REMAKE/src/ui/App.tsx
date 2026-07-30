import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import {
  createGameEngine,
  GameSession,
  LocalStorageDevSaveAdapter,
  type GameLocationKey,
  type GameUiDiagnostics,
  type GameUiDomain,
  type GameUiSnapshotMap,
  type WorldEncounterContext,
} from "../engine";
import {
  applyBrowserTestSeed,
  applyManualEvidenceFixture,
} from "../testing/browserTestSeeds";
import { EventPanel } from "./EventPanel";
import { LazyRouteErrorBoundary } from "./LazyRouteErrorBoundary";
import { LegalFooter } from "./LegalFooter";
import { OutsideView } from "./OutsideView";
import { PathView } from "./PathView";
import { PersistenceWarning } from "./PersistenceWarning";
import { RecoveryImport } from "./RecoveryImport";
import { RoomView } from "./RoomView";
import { RuntimeFailureWarning } from "./RuntimeFailureWarning";
import { SessionErrorBoundary } from "./SessionErrorBoundary";
import { WorldView } from "./WorldView";

const FabricatorView = lazy(() =>
  import("./FabricatorView").then(({ FabricatorView }) => ({
    default: FabricatorView,
  })),
);
const FabricatorViewRetry = lazy(() => {
  // @ts-expect-error Vite uses the query to emit a fresh retry module URL.
  const retryImport = import("./FabricatorView?route-retry") as Promise<{
    loadRouteRetry: () => Promise<typeof import("./FabricatorView")>;
  }>;
  return retryImport
    .then(({ loadRouteRetry }) => loadRouteRetry())
    .then(({ FabricatorView }) => ({ default: FabricatorView }));
});
const ShipView = lazy(() =>
  import("./ShipView").then(({ ShipView }) => ({ default: ShipView })),
);
const ShipViewRetry = lazy(() => {
  // @ts-expect-error Vite uses the query to emit a fresh retry module URL.
  const retryImport = import("./ShipView?route-retry") as Promise<{
    loadRouteRetry: () => Promise<typeof import("./ShipView")>;
  }>;
  return retryImport
    .then(({ loadRouteRetry }) => loadRouteRetry())
    .then(({ ShipView }) => ({ default: ShipView }));
});
const SpaceView = lazy(() =>
  import("./SpaceView").then(({ SpaceView }) => ({ default: SpaceView })),
);
const SpaceViewRetry = lazy(() => {
  // @ts-expect-error Vite uses the query to emit a fresh retry module URL.
  const retryImport = import("./SpaceView?route-retry") as Promise<{
    loadRouteRetry: () => Promise<typeof import("./SpaceView")>;
  }>;
  return retryImport
    .then(({ loadRouteRetry }) => loadRouteRetry())
    .then(({ SpaceView }) => ({ default: SpaceView }));
});
const SpikeLab = __ADR_DEV_SURFACES__
  ? lazy(() =>
      import("./SpikeLab").then(({ SpikeLab }) => ({ default: SpikeLab })),
    )
  : null;
const SettingsView = __ADR_DEV_SURFACES__
  ? lazy(() =>
      import("./SettingsView").then(({ SettingsView }) => ({
        default: SettingsView,
      })),
    )
  : null;

interface TestHarness {
  advance: (ms: number) => void;
  setState: (path: string, value: unknown) => void;
  getState: (path: string) => unknown;
  setRngSequence: (values: number[]) => void;
  triggerEvent: () => void;
  triggerEventByKey: (key: string) => void;
  triggerWorldEncounter: (context: WorldEncounterContext) => void;
  triggerWorldSetpiece: (scene: string) => void;
  save: () => void;
  load: () => boolean;
  refresh: () => void;
  uiDiagnostics: () => GameUiDiagnostics;
}

const TEST_HARNESS_RNG_SEED = 0x1fada462;

export function App() {
  const query = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search);
  }, []);
  const testHarnessEnabled =
    __ADR_DEV_SURFACES__ && query !== false && query.get("testHarness") === "1";
  const manualFixture =
    __ADR_DEV_SURFACES__ && query !== false ? query.get("manualFixture") : null;
  const testProductionRng =
    query !== false && query.get("testRng") === "production";
  const testSeed = query === false ? null : query.get("testSeed");
  const debugEnabled =
    __ADR_DEV_SURFACES__ && query !== false && query.get("debug") === "1";
  const showSpikes =
    __ADR_DEV_SURFACES__ && query !== false && query.get("spikes") === "1";
  const session = useMemo(() => {
    const nextSession = new GameSession(
      createGameEngine({
        rngSeed:
          testHarnessEnabled && !testProductionRng
            ? TEST_HARNESS_RNG_SEED
            : undefined,
        saveAdapter:
          typeof window === "undefined"
            ? undefined
            : new LocalStorageDevSaveAdapter(),
      }),
    );
    if (testHarnessEnabled) applyBrowserTestSeed(nextSession, testSeed);
    else if (
      manualFixture === null ||
      !applyManualEvidenceFixture(nextSession, manualFixture)
    )
      nextSession.loadDevState();
    return nextSession;
  }, [manualFixture, testHarnessEnabled, testProductionRng, testSeed]);
  const navigation = useSessionUiSnapshot(session, "navigation");
  const event = useSessionUiSnapshot(session, "event");
  const [hyperConfirmationOpen, setHyperConfirmationOpen] = useState(false);
  const hyperButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalOpen = event !== null || hyperConfirmationOpen;
  const activeLocation =
    !debugEnabled && navigation.location === "settings"
      ? "room"
      : navigation.location;
  useFocusOwnership(activeLocation, event);
  useEffect(() => {
    if (event !== null) setHyperConfirmationOpen(false);
  }, [event]);
  const selectLocation = useCallback(
    (location: GameLocationKey) => {
      if (location === "settings" && !debugEnabled) return;
      session.setLocation(location);
    },
    [debugEnabled, session],
  );
  const tabs = [
    { location: "room" as const, label: navigation.roomTitle },
    ...(navigation.outside.unlocked
      ? [{ location: "outside" as const, label: navigation.outside.title }]
      : []),
    ...(navigation.path.unlocked
      ? [{ location: "path" as const, label: navigation.path.title }]
      : []),
    ...(navigation.fabricator.unlocked
      ? [
          {
            location: "fabricator" as const,
            label: navigation.fabricator.title,
          },
        ]
      : []),
    ...(navigation.ship.unlocked
      ? [{ location: "ship" as const, label: navigation.ship.title }]
      : []),
    ...(navigation.worldActive
      ? [{ location: "world" as const, label: "world" }]
      : []),
    ...(debugEnabled
      ? [{ location: "settings" as const, label: "settings" }]
      : []),
  ];

  useEffect(() => {
    session.update();
    if (testHarnessEnabled) return undefined;
    session.start();
    return () => session.stop();
  }, [session, testHarnessEnabled]);

  useEffect(() => {
    if (!testHarnessEnabled || typeof window === "undefined") return undefined;
    const harness: TestHarness = {
      advance: (ms) => session.advanceForTest(ms),
      setState: (path, value) => session.setStateForTest(path, value),
      getState: (path) => session.getStateForTest(path),
      setRngSequence: (values) => session.setRngSequenceForTest(values),
      triggerEvent: () => session.triggerEventForTest(),
      triggerEventByKey: (key) => session.triggerEventByKeyForTest(key),
      triggerWorldEncounter: (context) =>
        session.triggerWorldEncounter(context),
      triggerWorldSetpiece: (scene) => session.triggerWorldSetpiece(scene),
      save: () => session.saveDevState(),
      load: () => session.loadDevState(),
      refresh: () => session.update(),
      uiDiagnostics: () => session.uiDiagnostics(),
    };
    (window as Window & { __adrTest?: TestHarness }).__adrTest = harness;
    return () => {
      delete (window as Window & { __adrTest?: TestHarness }).__adrTest;
    };
  }, [session, testHarnessEnabled]);

  return (
    <SessionErrorBoundary session={session}>
      <main
        className={
          activeLocation === "world"
            ? "appShell worldShell"
            : activeLocation === "space"
              ? "appShell spaceShell"
              : "appShell"
        }
        aria-label="A Dark Room"
      >
        <div
          className="gameSurface"
          inert={modalOpen}
          aria-hidden={modalOpen ? true : undefined}
        >
          {manualFixture === "space-realtime" && (
            <p className="evidenceFixtureBanner" role="status">
              Development evidence fixture: Ship-ready state, normal real-time
              clock, ordinary keyboard controls, and no console test API.
            </p>
          )}
          <PersistenceWarning session={session} />
          <RuntimeFailureWarning
            failure={navigation.runtimeFailure}
            onDismiss={() => session.dismissRuntimeFailure()}
          />
          {activeLocation !== "space" && (
            <div className="locationNavigation">
              <LocationTabs
                tabs={tabs}
                activeLocation={activeLocation}
                onSelect={selectLocation}
              />
              <button
                ref={hyperButtonRef}
                type="button"
                className="hyperModeButton"
                aria-pressed={navigation.hyperMode}
                onClick={() => {
                  if (navigation.hyperMode) {
                    session.setHyperMode(false);
                  } else {
                    setHyperConfirmationOpen(true);
                  }
                }}
              >
                {navigation.hyperMode ? "classic." : "hyper."}
              </button>
            </div>
          )}

          <div
            id={locationPanelId(activeLocation)}
            role={activeLocation === "space" ? undefined : "tabpanel"}
            aria-labelledby={
              activeLocation === "space"
                ? undefined
                : locationTabId(activeLocation)
            }
          >
            <RecoverableLocationPanel
              key={activeLocation}
              location={activeLocation}
              session={session}
            />
          </div>
          {!testHarnessEnabled && (
            <>
              <RecoveryImport session={session} />
              <LegalFooter />
            </>
          )}
        </div>
        <EventOverlay event={event} session={session} />
        <HyperConfirmation
          open={hyperConfirmationOpen && event === null}
          onConfirm={() => {
            session.setHyperMode(true);
            setHyperConfirmationOpen(false);
            requestAnimationFrame(() => hyperButtonRef.current?.focus());
          }}
          onCancel={() => {
            setHyperConfirmationOpen(false);
            requestAnimationFrame(() => hyperButtonRef.current?.focus());
          }}
        />
        {showSpikes && SpikeLab && (
          <Suspense fallback={<p role="status">loading spike…</p>}>
            <SpikeLab />
          </Suspense>
        )}
      </main>
    </SessionErrorBoundary>
  );
}

function LocationTabs({
  tabs,
  activeLocation,
  onSelect,
}: {
  tabs: Array<{ location: GameLocationKey; label: string }>;
  activeLocation: GameLocationKey;
  onSelect: (location: GameLocationKey) => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex(
      (tab) => tab.location === event.currentTarget.dataset.location,
    );
    if (index < 0) return;

    let nextIndex: number | undefined;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = tabs[nextIndex];
    if (!next) return;
    onSelect(next.location);
    document.getElementById(locationTabId(next.location))?.focus();
  };

  return (
    <nav className="locationTabs" role="tablist" aria-label="locations">
      {tabs.map((tab) => {
        const selected = tab.location === activeLocation;
        return (
          <button
            key={tab.location}
            id={locationTabId(tab.location)}
            data-location={tab.location}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={locationPanelId(tab.location)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.location)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function locationTabId(location: GameLocationKey) {
  return `location-tab-${location}`;
}

function locationPanelId(location: GameLocationKey) {
  return `location-panel-${location}`;
}

function RecoverableLocationPanel({
  location,
  session,
}: {
  location: GameLocationKey;
  session: GameSession;
}) {
  const [retry, setRetry] = useState(false);
  const panel = (
    <Suspense fallback={<p role="status">loading…</p>}>
      <LocationPanel
        location={location}
        retryLazyRoute={retry}
        session={session}
      />
    </Suspense>
  );
  if (!isLazyLocation(location)) return panel;

  return (
    <LazyRouteErrorBoundary
      key={`${location}:${retry}`}
      location={location}
      onLeave={() => {
        session.setLocation("room");
        session.saveDevState();
      }}
      onReload={() => {
        session.saveDevState();
        window.location.reload();
      }}
      onRetry={() => {
        session.saveDevState();
        setRetry(true);
      }}
    >
      {panel}
    </LazyRouteErrorBoundary>
  );
}

function isLazyLocation(
  location: GameLocationKey,
): location is Extract<GameLocationKey, "fabricator" | "ship" | "space"> {
  return (
    location === "fabricator" || location === "ship" || location === "space"
  );
}

function LocationPanel({
  location,
  retryLazyRoute,
  session,
}: {
  location: GameLocationKey;
  retryLazyRoute: boolean;
  session: GameSession;
}) {
  switch (location) {
    case "room":
      return <RoomLocation session={session} />;
    case "outside":
      return <OutsideLocation session={session} />;
    case "path":
      return <PathLocation session={session} />;
    case "world":
      return <WorldLocation session={session} />;
    case "fabricator":
      return <FabricatorLocation retry={retryLazyRoute} session={session} />;
    case "ship":
      return <ShipLocation retry={retryLazyRoute} session={session} />;
    case "space":
      return <SpaceLocation retry={retryLazyRoute} session={session} />;
    case "settings":
      return <SettingsLocation session={session} />;
  }
}

function RoomLocation({ session }: { session: GameSession }) {
  const { room, compassDirection } = useSessionUiSnapshot(session, "room");
  return (
    <RoomView
      snapshot={room}
      compassDirection={compassDirection}
      onLightFire={() => session.lightFire()}
      onStokeFire={() => session.stokeFire()}
      onBuild={(key) => session.build(key)}
      onBuy={(key) => session.buy(key)}
    />
  );
}

function OutsideLocation({ session }: { session: GameSession }) {
  const snapshot = useSessionUiSnapshot(session, "outside");
  return (
    <OutsideView
      snapshot={snapshot.outside}
      roomSnapshot={snapshot.room}
      compassDirection={snapshot.compassDirection}
      onGatherWood={() => session.gatherWood()}
      onCheckTraps={() => session.checkTraps()}
      onIncreaseWorker={(worker, amount) =>
        session.increaseWorker(worker, amount)
      }
      onDecreaseWorker={(worker, amount) =>
        session.decreaseWorker(worker, amount)
      }
    />
  );
}

function PathLocation({ session }: { session: GameSession }) {
  const snapshot = useSessionUiSnapshot(session, "path");
  return (
    <PathView
      snapshot={snapshot.path}
      roomSnapshot={snapshot.room}
      onIncreaseSupply={(key, amount) => session.increaseSupply(key, amount)}
      onDecreaseSupply={(key, amount) => session.decreaseSupply(key, amount)}
      onEmbark={() => session.embark()}
    />
  );
}

function WorldLocation({ session }: { session: GameSession }) {
  const snapshot = useSessionUiSnapshot(session, "world");
  return (
    <WorldView
      snapshot={snapshot}
      onMove={(direction) => session.moveWorld(direction)}
      onEnterLandmark={() => session.enterWorldLandmark()}
      onReturnHome={() => session.returnFromWorld()}
    />
  );
}

function ShipLocation({
  retry,
  session,
}: {
  retry: boolean;
  session: GameSession;
}) {
  const snapshot = useSessionUiSnapshot(session, "ship");
  const View = retry ? ShipViewRetry : ShipView;
  return (
    <View
      snapshot={snapshot}
      onReinforceHull={() => session.reinforceShipHull()}
      onUpgradeEngine={() => session.upgradeShipEngine()}
      onRequestLiftOff={() => session.requestShipLiftOff()}
      onConfirmLiftOff={() => session.confirmShipLiftOff()}
      onLinger={() => session.lingerAtShip()}
    />
  );
}

function SpaceLocation({
  retry,
  session,
}: {
  retry: boolean;
  session: GameSession;
}) {
  const snapshot = useSessionUiSnapshot(session, "space");
  const View = retry ? SpaceViewRetry : SpaceView;
  useLayoutEffect(() => {
    document
      .querySelector<HTMLElement>('[data-focus-owner="space"]')
      ?.focus({ preventScroll: true });
  }, []);
  return (
    <View
      snapshot={snapshot}
      onMove={(direction) => session.moveSpace(direction)}
      onMovementChange={(direction, active) =>
        session.setSpaceMovement(direction, active)
      }
      onContinueEnding={() => session.continueSpaceEnding()}
      onRestart={() => {
        if (session.restartAfterEnding()) window.location.reload();
      }}
    />
  );
}

function FabricatorLocation({
  retry,
  session,
}: {
  retry: boolean;
  session: GameSession;
}) {
  const snapshot = useSessionUiSnapshot(session, "fabricator");
  const View = retry ? FabricatorViewRetry : FabricatorView;
  return (
    <View snapshot={snapshot} onFabricate={(key) => session.fabricate(key)} />
  );
}

function SettingsLocation({ session }: { session: GameSession }) {
  const snapshot = useSessionUiSnapshot(session, "settings");
  const [saveStatus, setSaveStatus] = useState("idle");
  if (!SettingsView) return null;
  return (
    <SettingsView
      settings={snapshot.settings}
      location={snapshot.location}
      room={snapshot.room}
      outside={snapshot.outside}
      saveStatus={saveStatus}
      onToggleSpeedX10={(enabled) => session.setDebugSpeedX10(enabled)}
      onToggleIncomeX10={(enabled) => session.setDebugIncomeX10(enabled)}
      onSave={() => {
        session.saveDevState();
        setSaveStatus("saved");
      }}
      onLoad={() => setSaveStatus(session.loadDevState() ? "loaded" : "empty")}
      onClear={() => {
        session.clearDevState();
        setSaveStatus("cleared");
      }}
    />
  );
}

function EventOverlay({
  event,
  session,
}: {
  event: GameUiSnapshotMap["event"];
  session: GameSession;
}) {
  return (
    <EventPanel
      event={event}
      onChoose={(key) => session.chooseEventButton(key)}
      onCombatAction={(key) => session.chooseEventCombatAction(key)}
      onLootAction={(key) => session.chooseEventLootAction(key)}
    />
  );
}

function HyperConfirmation({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);
  if (!open) return null;

  return (
    <>
      <div className="eventBackdrop" aria-hidden="true" />
      <section
        ref={panelRef}
        className="eventPanel hyperConfirmationPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hyper-confirmation-title"
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "Escape") {
            keyboardEvent.preventDefault();
            onCancel();
            return;
          }
          if (keyboardEvent.key !== "Tab") return;
          const buttons = Array.from(
            keyboardEvent.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button",
            ),
          );
          const first = buttons[0];
          const last = buttons.at(-1);
          if (!first || !last) return;
          if (keyboardEvent.shiftKey && document.activeElement === first) {
            keyboardEvent.preventDefault();
            last.focus();
          } else if (
            !keyboardEvent.shiftKey &&
            document.activeElement === last
          ) {
            keyboardEvent.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id="hyper-confirmation-title">Go Hyper?</h2>
        <p>
          turning hyper mode speeds up the game to x2 speed. do you want to do
          that?
        </p>
        <div className="eventButtons">
          <button type="button" onClick={onConfirm}>
            yes
          </button>
          <button type="button" onClick={onCancel}>
            no
          </button>
        </div>
      </section>
    </>
  );
}

function useFocusOwnership(
  location: GameLocationKey,
  event: GameUiSnapshotMap["event"],
) {
  const previous = useRef({ location, eventOpen: event !== null });

  useLayoutEffect(() => {
    const eventClosed = previous.current.eventOpen && event === null;
    const crossedOwnedBoundary =
      event === null &&
      previous.current.location !== location &&
      (previous.current.location === "world" ||
        location === "world" ||
        previous.current.location === "space" ||
        location === "space");

    if (eventClosed || crossedOwnedBoundary) {
      document
        .querySelector<HTMLElement>(`[data-focus-owner="${location}"]`)
        ?.focus({ preventScroll: true });
    }

    previous.current = { location, eventOpen: event !== null };
  }, [event, location]);
}

function useSessionUiSnapshot<TDomain extends GameUiDomain>(
  session: GameSession,
  domain: TDomain,
): GameUiSnapshotMap[TDomain] {
  const subscribe = useCallback(
    (listener: () => void) => session.subscribeUi(domain, listener),
    [domain, session],
  );
  const getSnapshot = useCallback(
    () => session.uiSnapshot(domain),
    [domain, session],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => session.recordUiRender(domain));
  return snapshot;
}
