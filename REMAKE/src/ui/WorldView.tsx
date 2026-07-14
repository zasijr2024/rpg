import { useLayoutEffect, useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { WorldMoveDirection, WorldStateSnapshot } from "../engine";
import { NotificationLog } from "./NotificationLog";

interface WorldViewProps {
  snapshot: WorldStateSnapshot;
  onMove: (direction: WorldMoveDirection) => void;
  onEnterLandmark: () => void;
  onReturnHome: () => void;
}

export function WorldView({
  snapshot,
  onMove,
  onEnterLandmark,
  onReturnHome,
}: WorldViewProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressNextMapClick = useRef(false);
  const conditionLabels = worldConditionLabels(snapshot);

  useLayoutEffect(() => {
    panelRef.current?.focus();
  }, []);

  if (!snapshot.active) return null;

  return (
    <section
      ref={panelRef}
      className="worldPanel"
      aria-label="world"
      data-focus-owner="world"
      tabIndex={0}
      onKeyDown={(event) => handleWorldKey(event, onMove)}
    >
      <div className="worldLayout">
        <div className="worldMapStage" aria-hidden="true">
          <pre
            className="worldMap"
            onPointerDown={(event) => {
              swipeStart.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              const direction = worldMapSwipeDirection({
                start: swipeStart.current,
                end: { x: event.clientX, y: event.clientY },
              });
              swipeStart.current = null;
              if (!direction) return;
              suppressNextMapClick.current = true;
              onMove(direction);
            }}
            onPointerCancel={() => {
              swipeStart.current = null;
            }}
            onClick={(event) => {
              if (suppressNextMapClick.current) {
                suppressNextMapClick.current = false;
                return;
              }
              handleWorldMapClick(event, snapshot, onMove);
            }}
          >
            {snapshot.rows.map((row, rowIndex) => (
              <span key={rowIndex}>
                {row.map((cell) =>
                  cell.label ? (
                    <span
                      key={`${cell.x},${cell.y}`}
                      className="worldMapLandmark"
                      title={cell.label}
                    >
                      {cell.glyph}
                    </span>
                  ) : (
                    cell.glyph
                  ),
                )}
                {rowIndex < snapshot.rows.length - 1 ? "\n" : ""}
              </span>
            ))}
          </pre>
        </div>

        <WorldAccessibleModel snapshot={snapshot} />

        <aside className="worldSidebar" aria-label="world controls">
          <div className="worldStatus" aria-label="world status">
            <div>
              <span>hp</span>
              <span>
                {snapshot.hp}/{snapshot.maxHp}
              </span>
            </div>
            <div>
              <span>water</span>
              <span>
                {snapshot.water}/{snapshot.maxWater}
              </span>
            </div>
            <div>
              <span>food</span>
              <span>{snapshot.food}</span>
            </div>
            <div>
              <span>distance</span>
              <span>{snapshot.distance}</span>
            </div>
            {conditionLabels.length > 0 && (
              <div
                className="worldConditionRow"
                aria-label="world condition"
                aria-live="polite"
              >
                <span>status</span>
                <span>{conditionLabels.join(", ")}</span>
              </div>
            )}
          </div>

          {snapshot.landmark && (
            <section className="landmarkPanel" aria-label="landmark">
              <div>{snapshot.landmark.label}</div>
              <button type="button" onClick={onEnterLandmark}>
                enter
              </button>
            </section>
          )}

          <div className="worldControls" aria-label="movement">
            <button
              type="button"
              aria-label="north"
              onClick={() => onMove("north")}
            >
              north
            </button>
            <button
              type="button"
              aria-label="west"
              onClick={() => onMove("west")}
            >
              west
            </button>
            <button
              type="button"
              aria-label="east"
              onClick={() => onMove("east")}
            >
              east
            </button>
            <button
              type="button"
              aria-label="south"
              onClick={() => onMove("south")}
            >
              south
            </button>
          </div>

          {snapshot.canReturn && (
            <div className="actionRow">
              <button type="button" onClick={onReturnHome}>
                return
              </button>
            </div>
          )}

          <NotificationLog
            label="world notifications"
            notifications={snapshot.notifications}
          />
        </aside>
      </div>
    </section>
  );
}

function WorldAccessibleModel({ snapshot }: { snapshot: WorldStateSnapshot }) {
  const { accessible } = snapshot;
  return (
    <section className="screenReaderOnly" aria-label="world information">
      <h2>current world state</h2>
      <dl>
        <div>
          <dt>position</dt>
          <dd>
            x {snapshot.x}, y {snapshot.y}; {accessible.terrain}
          </dd>
        </div>
        <div>
          <dt>resources</dt>
          <dd>
            {snapshot.hp} of {snapshot.maxHp} health, {snapshot.water} of{" "}
            {snapshot.maxWater} water, {snapshot.food} cured meat
          </dd>
        </div>
        <div>
          <dt>village</dt>
          <dd>
            {accessible.villageDistance} moves {accessible.villageDirection}
          </dd>
        </div>
        <div>
          <dt>available moves</dt>
          <dd>{accessible.moves.join(", ")}</dd>
        </div>
      </dl>
      <section aria-label="visible nearby landmarks">
        <h3>visible nearby landmarks</h3>
        {accessible.landmarks.length > 0 ? (
          <ul>
            {accessible.landmarks.map((landmark, index) => (
              <li
                key={`${landmark.label}:${landmark.direction}:${landmark.distance}:${index}`}
              >
                {landmark.label}: {landmark.distance} moves {landmark.direction}
              </li>
            ))}
          </ul>
        ) : (
          <p>no visible landmarks nearby</p>
        )}
      </section>
    </section>
  );
}

export function worldConditionLabels({
  danger,
  starvation,
  thirst,
}: Pick<WorldStateSnapshot, "danger" | "starvation" | "thirst">): string[] {
  const labels: string[] = [];
  if (danger) labels.push("danger");
  if (starvation) labels.push("starvation");
  if (thirst) labels.push("thirst");
  return labels;
}

export function worldMapSwipeDirection({
  start,
  end,
  threshold = 30,
}: {
  start: { x: number; y: number } | null;
  end: { x: number; y: number };
  threshold?: number;
}): WorldMoveDirection | null {
  if (!start || threshold <= 0) return null;
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return null;
  }
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? "west" : "east";
  }
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return deltaY < 0 ? "north" : "south";
  }
  return null;
}

function handleWorldKey(
  event: KeyboardEvent<HTMLElement>,
  onMove: (direction: WorldMoveDirection) => void,
) {
  const direction = worldKeyDirection(event.key);
  if (!direction) return;
  event.preventDefault();
  onMove(direction);
}

export function worldKeyDirection(key: string): WorldMoveDirection | null {
  const keyMap: Record<string, WorldMoveDirection> = {
    ArrowUp: "north",
    w: "north",
    W: "north",
    ArrowDown: "south",
    s: "south",
    S: "south",
    ArrowLeft: "west",
    a: "west",
    A: "west",
    ArrowRight: "east",
    d: "east",
    D: "east",
  };
  return keyMap[key] ?? null;
}

function handleWorldMapClick(
  event: MouseEvent<HTMLElement>,
  snapshot: WorldStateSnapshot,
  onMove: (direction: WorldMoveDirection) => void,
) {
  const direction = worldMapClickDirection({
    rect: event.currentTarget.getBoundingClientRect(),
    clickX: event.clientX,
    clickY: event.clientY,
    mapX: snapshot.x,
    mapY: snapshot.y,
    columns: snapshot.rows[0]?.length ?? 0,
    rows: snapshot.rows.length,
  });
  if (!direction) return;
  onMove(direction);
}

export function worldMapClickDirection({
  rect,
  clickX,
  clickY,
  mapX,
  mapY,
  columns,
  rows,
}: {
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  clickX: number;
  clickY: number;
  mapX: number;
  mapY: number;
  columns: number;
  rows: number;
}): WorldMoveDirection | null {
  if (columns < 2 || rows < 2 || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const centerX = rect.left + (rect.width * mapX) / (columns - 1);
  const centerY = rect.top + (rect.height * mapY) / (rows - 1);
  const relativeX = clickX - centerX;
  const relativeY = clickY - centerY;

  if (relativeX > relativeY && relativeX < -relativeY) return "north";
  if (relativeX < relativeY && relativeX > -relativeY) return "south";
  if (relativeX < relativeY && relativeX < -relativeY) return "west";
  if (relativeX > relativeY && relativeX > -relativeY) return "east";
  return null;
}
