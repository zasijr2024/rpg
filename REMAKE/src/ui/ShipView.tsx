import type { ShipStateSnapshot } from "../engine";
import { NotificationLog } from "./NotificationLog";

interface ShipViewProps {
  snapshot: ShipStateSnapshot;
  onReinforceHull: () => void;
  onUpgradeEngine: () => void;
  onRequestLiftOff: () => void;
  onConfirmLiftOff: () => void;
  onLinger: () => void;
}

export function ShipView({
  snapshot,
  onReinforceHull,
  onUpgradeEngine,
  onRequestLiftOff,
  onConfirmLiftOff,
  onLinger,
}: ShipViewProps) {
  return (
    <section
      className="shipPanel"
      aria-label={snapshot.title}
      data-focus-owner="ship"
      tabIndex={-1}
    >
      <div className="playColumn">
        <dl className="shipStatus" aria-label="ship status">
          <div>
            <dt>hull:</dt>
            <dd>{snapshot.hull}</dd>
          </div>
          <div>
            <dt>engine:</dt>
            <dd>{snapshot.thrusters}</dd>
          </div>
        </dl>

        <div className="shipActions" role="group" aria-label="ship actions">
          <ShipAction
            label="reinforce hull"
            cost={snapshot.reinforceCost}
            disabled={!snapshot.canReinforce}
            onClick={onReinforceHull}
          />
          <ShipAction
            label="upgrade engine"
            cost={snapshot.engineCost}
            disabled={!snapshot.canUpgradeEngine}
            onClick={onUpgradeEngine}
          />
          <button
            type="button"
            disabled={!snapshot.canLiftOff}
            onClick={onRequestLiftOff}
          >
            <span className="buttonLabel">lift off</span>
            {snapshot.liftOffCooldownMs > 0 && (
              <span className="costText">
                ready in {Math.ceil(snapshot.liftOffCooldownMs / 1000)}s
              </span>
            )}
          </button>
        </div>

        {snapshot.awaitingLiftOffConfirmation && (
          <section
            className="liftOffWarning"
            aria-label="Ready to Leave?"
            aria-live="polite"
          >
            <h2>Ready to Leave?</h2>
            <p>time to get out of this place. won't be coming back.</p>
            <div>
              <button type="button" onClick={onConfirmLiftOff}>
                lift off
              </button>
              <button type="button" onClick={onLinger}>
                linger
              </button>
            </div>
          </section>
        )}

        <NotificationLog
          label="ship notifications"
          notifications={snapshot.notifications}
        />
      </div>

      <aside className="sideColumn shipStores" aria-label="stores">
        <p>stores:</p>
        {snapshot.alienAlloy > 0 && (
          <div className="storeRow">
            <span>alien alloy</span>
            <span>{snapshot.alienAlloy}</span>
          </div>
        )}
      </aside>
    </section>
  );
}

function ShipAction({
  label,
  cost,
  disabled,
  onClick,
}: {
  label: string;
  cost: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}>
      <span className="buttonLabel">{label}</span>
      <span className="costText">alien alloy: {cost}</span>
    </button>
  );
}
