import type { KeyboardEvent } from "react";
import type { WorldMoveDirection, WorldStateSnapshot } from "../engine";

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
  if (!snapshot.active) return null;

  return (
    <section
      className="worldPanel"
      aria-label="world"
      tabIndex={0}
      onKeyDown={(event) => handleWorldKey(event, onMove)}
    >
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
      </div>

      <pre className="worldMap" aria-label="world map">
        {snapshot.rows
          .map((row) => row.map((cell) => cell.glyph).join(""))
          .join("\n")}
      </pre>

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
        <button type="button" aria-label="west" onClick={() => onMove("west")}>
          west
        </button>
        <button type="button" aria-label="east" onClick={() => onMove("east")}>
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
    </section>
  );
}

function handleWorldKey(
  event: KeyboardEvent<HTMLElement>,
  onMove: (direction: WorldMoveDirection) => void,
) {
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
  const direction = keyMap[event.key];
  if (!direction) return;
  event.preventDefault();
  onMove(direction);
}
