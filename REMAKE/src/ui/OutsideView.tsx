import type { CSSProperties } from "react";
import type { OutsideStateSnapshot, RoomStateSnapshot } from "../engine";
import { NotificationLog } from "./NotificationLog";
import { StoresPanel } from "./StoresPanel";
import { CompactStepper } from "./CompactStepper";

interface OutsideViewProps {
  snapshot: OutsideStateSnapshot;
  roomSnapshot: Pick<RoomStateSnapshot, "stores" | "income">;
  compassDirection?: string;
  onGatherWood: () => void;
  onCheckTraps: () => void;
  onIncreaseWorker: (worker: string, amount: number) => void;
  onDecreaseWorker: (worker: string, amount: number) => void;
}

export function OutsideView({
  snapshot,
  roomSnapshot,
  compassDirection,
  onGatherWood,
  onCheckTraps,
  onIncreaseWorker,
  onDecreaseWorker,
}: OutsideViewProps) {
  if (!snapshot.unlocked) return null;

  const cooldownSeconds = Math.ceil(snapshot.gatherCooldown.remainingMs / 1000);
  const trapCooldownSeconds = Math.ceil(
    snapshot.trapCooldown.remainingMs / 1000,
  );
  const cooldownStyle = {
    "--cooldown-progress": `${snapshot.gatherCooldown.progress * 100}%`,
  } as CSSProperties;
  const trapCooldownStyle = {
    "--cooldown-progress": `${snapshot.trapCooldown.progress * 100}%`,
  } as CSSProperties;

  return (
    <section
      className="outsidePanel"
      aria-label={snapshot.title}
      data-focus-owner="outside"
      tabIndex={-1}
    >
      <div className="playColumn">
        {snapshot.villageRows.length > 0 && (
          <section
            className="villagePanel"
            aria-label={snapshot.maxPopulation > 0 ? "village" : "forest"}
          >
            {snapshot.villageRows.map((row) => (
              <div className="storeRow" key={row.key}>
                <span>{row.key}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div className="storeRow">
              <span>pop</span>
              <span>
                {snapshot.population}/{snapshot.maxPopulation}
              </span>
            </div>
          </section>
        )}
        <div className="actionRow">
          <button
            type="button"
            className={
              snapshot.gatherCooldown.active ? "cooldownButton" : undefined
            }
            aria-disabled={snapshot.gatherCooldown.active}
            style={cooldownStyle}
            title={`wood: +${snapshot.gatherAmount}`}
            onClick={() => {
              if (!snapshot.gatherCooldown.active) onGatherWood();
            }}
          >
            <span>gather wood</span>
            {snapshot.gatherCooldown.active && (
              <span className="cooldownText">{cooldownSeconds}s</span>
            )}
          </button>
          {snapshot.hasTraps && (
            <button
              type="button"
              className={
                snapshot.trapCooldown.active ? "cooldownButton" : undefined
              }
              aria-disabled={snapshot.trapCooldown.active}
              style={trapCooldownStyle}
              onClick={() => {
                if (!snapshot.trapCooldown.active) onCheckTraps();
              }}
            >
              <span>check traps</span>
              {snapshot.trapCooldown.active && (
                <span className="cooldownText">{trapCooldownSeconds}s</span>
              )}
            </button>
          )}
        </div>
        {snapshot.workerRows.length > 0 && (
          <section className="workersPanel" aria-label="workers">
            {snapshot.workerRows.map((worker) => {
              const detailsId = `worker-details-${worker.key.replace(/[^a-z0-9]+/gi, "-")}`;
              const income = worker.income
                .map((entry) => `${entry.store}: ${entry.text}`)
                .join(", ");
              return (
                <div className="workerRow" key={worker.key}>
                  <span
                    className="workerName compactDetail"
                    tabIndex={0}
                    aria-describedby={detailsId}
                  >
                    {worker.name}
                  </span>
                  <span id={detailsId} className="screenReaderOnly">
                    income: {income || "none"}
                  </span>
                  <span className="workerCount">{worker.value}</span>
                  {worker.controlled && (
                    <CompactStepper
                      className="workerControls"
                      label={`${worker.name} worker controls`}
                      controls={[
                        {
                          key: "increase",
                          label: `${worker.name} +1`,
                          disabled: !worker.canIncrease,
                          onClick: () => onIncreaseWorker(worker.key, 1),
                          className: "upBtn",
                        },
                        {
                          key: "decrease",
                          label: `${worker.name} -1`,
                          disabled: !worker.canDecrease,
                          onClick: () => onDecreaseWorker(worker.key, 1),
                          className: "dnBtn",
                        },
                        {
                          key: "increase-many",
                          label: `${worker.name} +10`,
                          disabled: !worker.canIncrease,
                          onClick: () => onIncreaseWorker(worker.key, 10),
                          className: "upManyBtn",
                        },
                        {
                          key: "decrease-many",
                          label: `${worker.name} -10`,
                          disabled: !worker.canDecrease,
                          onClick: () => onDecreaseWorker(worker.key, 10),
                          className: "dnManyBtn",
                        },
                      ]}
                    />
                  )}
                </div>
              );
            })}
          </section>
        )}
        <NotificationLog
          label="outside notifications"
          notifications={snapshot.notifications}
        />
      </div>

      <aside className="sideColumn">
        <StoresPanel
          stores={roomSnapshot.stores}
          income={roomSnapshot.income}
          compassDirection={compassDirection}
        />
      </aside>
    </section>
  );
}
