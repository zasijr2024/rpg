import type { PathStateSnapshot } from "../engine";
import { StoresPanel } from "./StoresPanel";
import type { RoomStateSnapshot } from "../engine";

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

  return (
    <section className="pathPanel" aria-label={snapshot.title}>
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
          {snapshot.supplies.map((supply) => (
            <div
              className="outfitRow"
              key={supply.key}
              title={supplyTooltip(supply)}
            >
              <span className="outfitName">{supply.name}</span>
              <span className="outfitCount">{supply.outfit}</span>
              <span className="outfitControls">
                <button
                  className="upBtn"
                  type="button"
                  aria-label={`${supply.key} +1`}
                  disabled={!supply.canIncrease}
                  onClick={() => onIncreaseSupply(supply.key, 1)}
                />
                <button
                  className="dnBtn"
                  type="button"
                  aria-label={`${supply.key} -1`}
                  disabled={!supply.canDecrease}
                  onClick={() => onDecreaseSupply(supply.key, 1)}
                />
                <button
                  className="upManyBtn"
                  type="button"
                  aria-label={`${supply.key} +10`}
                  disabled={!supply.canIncreaseMany}
                  onClick={() => onIncreaseSupply(supply.key, 10)}
                />
                <button
                  className="dnManyBtn"
                  type="button"
                  aria-label={`${supply.key} -10`}
                  disabled={!supply.canDecreaseMany}
                  onClick={() => onDecreaseSupply(supply.key, 10)}
                />
              </span>
            </div>
          ))}
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
            disabled={!snapshot.canEmbark}
            onClick={onEmbark}
          >
            embark
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
