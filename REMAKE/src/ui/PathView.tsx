import type { PathStateSnapshot } from "../engine";
import { StoresPanel } from "./StoresPanel";
import type { RoomStateSnapshot } from "../engine";
import { CompactStepper } from "./CompactStepper";

interface PathViewProps {
  snapshot: PathStateSnapshot;
  roomSnapshot: Pick<RoomStateSnapshot, "stores" | "income">;
  onIncreaseSupply: (key: string, amount: number) => void;
  onDecreaseSupply: (key: string, amount: number) => void;
  onEmbark: () => void;
}

export function PathView({
  snapshot,
  roomSnapshot,
  onIncreaseSupply,
  onDecreaseSupply,
  onEmbark,
}: PathViewProps) {
  if (!snapshot.unlocked) return null;
  const embarkCooldownSeconds = Math.ceil(
    snapshot.embarkCooldown.remainingMs / 1000,
  );

  return (
    <section
      className="pathPanel"
      aria-label={snapshot.title}
      data-focus-owner="path"
      tabIndex={-1}
    >
      <div className="playColumn">
        <section className="outfitPanel" aria-label="supplies">
          <div className="bagSpace">
            free {Math.floor(snapshot.free)}/{snapshot.capacity}
          </div>
          <div className="outfitMeta">
            <span>armour</span>
            <span>{snapshot.armour}</span>
          </div>
          <div className="outfitMeta">
            <span>water</span>
            <span>{snapshot.water}</span>
          </div>
          {snapshot.supplies.map((supply) => {
            const detailsId = `supply-details-${supply.key.replace(/[^a-z0-9]+/gi, "-")}`;
            return (
              <div className="outfitRow" key={supply.key}>
                <span
                  className="outfitName compactDetail"
                  tabIndex={0}
                  aria-describedby={detailsId}
                >
                  {supply.name}
                </span>
                <span id={detailsId} className="screenReaderOnly">
                  {supplyTooltip(supply)}
                </span>
                <span className="outfitCount">{supply.outfit}</span>
                <CompactStepper
                  className="outfitControls"
                  label={`${supply.name} supply controls`}
                  controls={[
                    {
                      key: "increase",
                      label: `${supply.key} +1`,
                      disabled: !supply.canIncrease,
                      onClick: () => onIncreaseSupply(supply.key, 1),
                      className: "upBtn",
                    },
                    {
                      key: "decrease",
                      label: `${supply.key} -1`,
                      disabled: !supply.canDecrease,
                      onClick: () => onDecreaseSupply(supply.key, 1),
                      className: "dnBtn",
                    },
                    {
                      key: "increase-many",
                      label: `${supply.key} +10`,
                      disabled: !supply.canIncreaseMany,
                      onClick: () => onIncreaseSupply(supply.key, 10),
                      className: "upManyBtn",
                    },
                    {
                      key: "decrease-many",
                      label: `${supply.key} -10`,
                      disabled: !supply.canDecreaseMany,
                      onClick: () => onDecreaseSupply(supply.key, 10),
                      className: "dnManyBtn",
                    },
                  ]}
                />
              </div>
            );
          })}
        </section>

        {snapshot.perks.length > 0 && (
          <section className="perksPanel" aria-label="perks">
            {snapshot.perks.map((perk) => (
              <div className="storeRow" key={perk.key} title={perk.desc}>
                <span>{perk.name}</span>
              </div>
            ))}
          </section>
        )}

        <div className="actionRow">
          <button
            type="button"
            className={
              snapshot.embarkCooldown.active ? "cooldownButton" : undefined
            }
            disabled={!snapshot.canEmbark}
            onClick={onEmbark}
          >
            <span>embark</span>
            {snapshot.embarkCooldown.active && (
              <span className="cooldownText">{embarkCooldownSeconds}s</span>
            )}
          </button>
        </div>
      </div>

      <aside className="sideColumn">
        <StoresPanel
          stores={roomSnapshot.stores}
          income={roomSnapshot.income}
          compassDirection={snapshot.compassDirection}
        />
      </aside>
    </section>
  );
}

function supplyTooltip(supply: PathStateSnapshot["supplies"][number]): string {
  const rows: string[] = [];
  if (supply.type === "weapon" && supply.damage !== undefined) {
    rows.push(`damage ${supply.damage}`);
  } else if (supply.desc) {
    rows.push(supply.desc);
  }
  rows.push(`weight ${supply.weight}`);
  rows.push(`available ${Math.floor(supply.store - supply.outfit)}`);
  return rows.join("\n");
}
