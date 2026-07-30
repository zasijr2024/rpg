import type { CSSProperties } from "react";
import type { RoomActionOptionSnapshot, RoomStateSnapshot } from "../engine";
import { NotificationLog } from "./NotificationLog";
import { StoresPanel } from "./StoresPanel";

interface RoomViewProps {
  snapshot: RoomStateSnapshot;
  compassDirection?: string;
  onLightFire: () => void;
  onStokeFire: () => void;
  onBuild: (key: string) => void;
  onBuy: (key: string) => void;
}

export function RoomView({
  snapshot,
  compassDirection,
  onLightFire,
  onStokeFire,
  onBuild,
  onBuy,
}: RoomViewProps) {
  const cooldownActive = snapshot.activeCooldown.active;
  const cooldownSeconds = Math.ceil(snapshot.activeCooldown.remainingMs / 1000);
  const cooldownStyle = {
    "--cooldown-progress": `${snapshot.activeCooldown.progress * 100}%`,
  } as CSSProperties;

  return (
    <section
      className="roomPanel"
      aria-label={snapshot.title}
      data-focus-owner="room"
      tabIndex={-1}
    >
      <div className="playColumn">
        <div className="roomStatus" role="group" aria-label="room status">
          <div>
            <span>the fire is </span>
            <strong>{snapshot.fire}</strong>
          </div>
          <div>
            <span>the room is </span>
            <strong>{snapshot.temperature}</strong>
          </div>
        </div>

        <div className="actionRow">
          <button
            type="button"
            className={cooldownActive ? "cooldownButton" : undefined}
            aria-disabled={cooldownActive}
            style={cooldownStyle}
            onClick={() => {
              if (cooldownActive) return;
              if (snapshot.activeButton === "light fire") onLightFire();
              else onStokeFire();
            }}
          >
            <span>{snapshot.activeButton}</span>
            {cooldownActive && (
              <span className="cooldownText">{cooldownSeconds}s</span>
            )}
          </button>
        </div>

        <div className="roomActions">
          <ActionSection
            label="build"
            options={snapshot.buildOptions}
            onChoose={onBuild}
          />
          <ActionSection
            label="craft"
            options={snapshot.craftOptions}
            onChoose={onBuild}
          />
          <ActionSection
            label="buy"
            options={snapshot.buyOptions}
            onChoose={onBuy}
          />
        </div>

        <NotificationLog
          label="notifications"
          notifications={snapshot.notifications}
        />
      </div>

      <aside className="sideColumn">
        <StoresPanel
          stores={snapshot.stores}
          income={snapshot.income}
          compassDirection={compassDirection}
        />
      </aside>
    </section>
  );
}

function ActionSection({
  label,
  options,
  onChoose,
}: {
  label: string;
  options: RoomActionOptionSnapshot[];
  onChoose: (key: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <section className="actionPanel" aria-label={label}>
      <p>{label}:</p>
      <div className="buttonGrid">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={option.disabled}
            onClick={() => onChoose(option.key)}
          >
            <span className="buttonLabel">{option.name}</span>
            <span className="costText">{formatCost(option.cost)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatCost(cost: Record<string, number>): string {
  return Object.entries(cost)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}
