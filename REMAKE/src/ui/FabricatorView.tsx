import type {
  FabricatorCraftableSnapshot,
  FabricatorStateSnapshot,
} from "../engine";
import { NotificationLog } from "./NotificationLog";

interface FabricatorViewProps {
  snapshot: FabricatorStateSnapshot;
  onFabricate: (key: string) => void;
}

export function FabricatorView({ snapshot, onFabricate }: FabricatorViewProps) {
  return (
    <section
      className="fabricatorPanel"
      aria-label={snapshot.title}
      data-focus-owner="fabricator"
      tabIndex={-1}
    >
      <div className="playColumn">
        {snapshot.blueprints.length > 0 && (
          <section className="fabricatorBlueprints" aria-label="blueprints">
            <p>blueprints:</p>
            {snapshot.blueprints.map((blueprint) => (
              <div key={blueprint}>{blueprint}</div>
            ))}
          </section>
        )}

        <section className="fabricatorActions" aria-label="fabricate">
          <p>fabricate:</p>
          {snapshot.craftables.map((craftable) => (
            <FabricatorAction
              key={craftable.key}
              craftable={craftable}
              onClick={() => onFabricate(craftable.key)}
            />
          ))}
        </section>

        <NotificationLog
          label="fabricator notifications"
          notifications={snapshot.notifications}
        />
      </div>

      <aside className="sideColumn fabricatorStores" aria-label="stores">
        <p>stores:</p>
        {snapshot.stores.map(({ key, value }) => (
          <div className="storeRow" key={key}>
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </aside>
    </section>
  );
}

function FabricatorAction({
  craftable,
  onClick,
}: {
  craftable: FabricatorCraftableSnapshot;
  onClick: () => void;
}) {
  const quantity = craftable.quantity > 1 ? ` (x${craftable.quantity})` : "";
  return (
    <button type="button" disabled={craftable.disabled} onClick={onClick}>
      <span className="buttonLabel">
        {craftable.name}
        {quantity}
      </span>
      <span className="costText">
        {Object.entries(craftable.cost)
          .map(([resource, amount]) => `${resource}: ${amount}`)
          .join(", ")}
      </span>
    </button>
  );
}
