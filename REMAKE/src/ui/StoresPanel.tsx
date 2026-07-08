import type { RoomStateSnapshot } from "../engine";

interface StoresPanelProps {
  stores: RoomStateSnapshot["stores"];
  income: RoomStateSnapshot["income"];
  compassDirection?: string;
}

export function StoresPanel({
  stores,
  income,
  compassDirection,
}: StoresPanelProps) {
  const resources = stores.filter((store) => store.category === "resources");
  const special = stores.filter((store) => store.category === "special");
  const weapons = stores.filter((store) => store.category === "weapons");
  const groupedIncome = groupIncomeRows(income);

  if (resources.length === 0 && special.length === 0 && weapons.length === 0) {
    return null;
  }

  return (
    <div className="storesStack">
      {(resources.length > 0 || special.length > 0) && (
        <section className="storesPanel" aria-label="stores">
          <StoreRows stores={resources} compassDirection={compassDirection} />
          <StoreRows stores={special} compassDirection={compassDirection} />
          {groupedIncome.length > 0 && (
            <div className="incomeBlock" aria-label="income">
              {groupedIncome.map((incomeRow) => (
                <div className="incomeRow" key={incomeRow.source}>
                  <span className="incomeSource">{incomeRow.source}</span>
                  <span className="incomeText">
                    {incomeRow.parts.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {weapons.length > 0 && (
        <section className="storesPanel" aria-label="weapons">
          <StoreRows stores={weapons} compassDirection={compassDirection} />
        </section>
      )}
    </div>
  );
}

function groupIncomeRows(income: RoomStateSnapshot["income"]) {
  const grouped = new Map<string, string[]>();

  for (const incomeRow of income) {
    const parts = grouped.get(incomeRow.source) ?? [];
    parts.push(`${incomeRow.store} ${compactIncomeText(incomeRow.text)}`);
    grouped.set(incomeRow.source, parts);
  }

  return Array.from(grouped.entries()).map(([source, parts]) => ({
    source,
    parts,
  }));
}

function compactIncomeText(text: string) {
  return text.replace(" per ", "/");
}

function StoreRows({
  stores,
  compassDirection,
}: {
  stores: RoomStateSnapshot["stores"];
  compassDirection?: string;
}) {
  return (
    <>
      {stores.map((store) => (
        <div
          className="storeRow"
          key={store.key}
          title={storeTitle(store.key, compassDirection)}
        >
          <span>{store.key}</span>
          <span>{Math.floor(store.value)}</span>
        </div>
      ))}
    </>
  );
}

function storeTitle(
  key: string,
  compassDirection?: string,
): string | undefined {
  if (key !== "compass" || !compassDirection) return undefined;
  return `the compass points ${compassDirection}`;
}
