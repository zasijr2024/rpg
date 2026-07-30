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
  const groupedIncome = groupIncomeRows(income, stores);

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
            <div className="incomeBlock" role="group" aria-label="income">
              {groupedIncome.map((incomeRow) => (
                <div
                  className={
                    incomeRow.waitingFor.length > 0
                      ? "incomeRow incomeRowBlocked"
                      : "incomeRow"
                  }
                  key={incomeRow.source}
                >
                  <span className="incomeSource">{incomeRow.source}</span>
                  <span className="incomeText">
                    {incomeRow.waitingFor.length > 0 && "paused; nominal "}
                    {incomeRow.parts.join(", ")}
                  </span>
                  {incomeRow.waitingFor.length > 0 && (
                    <span className="incomeStatus">
                      waiting for {incomeRow.waitingFor.join(", ")}
                    </span>
                  )}
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

export function groupIncomeRows(
  income: RoomStateSnapshot["income"],
  stores: RoomStateSnapshot["stores"],
) {
  const grouped = new Map<
    string,
    { parts: string[]; rows: RoomStateSnapshot["income"] }
  >();
  const availableStores = new Map(
    stores.map((store) => [store.key, store.value]),
  );

  for (const incomeRow of income) {
    const group = grouped.get(incomeRow.source) ?? { parts: [], rows: [] };
    group.parts.push(`${incomeRow.store} ${compactIncomeText(incomeRow.text)}`);
    group.rows.push(incomeRow);
    grouped.set(incomeRow.source, group);
  }

  return Array.from(grouped.entries()).map(([source, group]) => {
    const isConverter = group.rows.some((row) => row.amount > 0);
    const waitingFor = isConverter
      ? group.rows
          .filter(
            (row) =>
              row.amount < 0 &&
              (availableStores.get(row.store) ?? 0) < Math.abs(row.amount),
          )
          .map((row) => row.store)
      : [];
    return {
      source,
      parts: group.parts,
      waitingFor,
    };
  });
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
