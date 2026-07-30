import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameSession, RoomStateSnapshot } from "../../engine";
import { SessionErrorBoundary } from "../../ui/SessionErrorBoundary";
import { RuntimeFailureWarning } from "../../ui/RuntimeFailureWarning";
import { groupIncomeRows } from "../../ui/StoresPanel";

const mountedRoots: Array<{
  root: ReturnType<typeof createRoot>;
  container: HTMLElement;
}> = [];

afterEach(async () => {
  for (const { root, container } of mountedRoots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
});

describe("StoresPanel converter truthfulness", () => {
  it("marks nominal converter output paused while any required input is short", () => {
    const rows = groupIncomeRows(
      [
        income("charcutier", "meat", -5),
        income("charcutier", "wood", -5),
        income("charcutier", "cured meat", 1),
      ],
      [store("meat", 2), store("wood", 20)],
    );

    expect(rows).toEqual([
      {
        source: "charcutier",
        parts: ["meat -5/10s", "wood -5/10s", "cured meat +1/10s"],
        waitingFor: ["meat"],
      },
    ]);
  });

  it("does not mislabel negative-only income such as theft as a converter", () => {
    expect(
      groupIncomeRows([income("thieves", "wood", -10)], [store("wood", 0)])[0]
        ?.waitingFor,
    ).toEqual([]);
  });
});

describe("SessionErrorBoundary recovery", () => {
  it("keeps the session available, contains fallback action failures, and retries the display", async () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const createObjectUrl = vi.fn(() => "blob:recovery");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );

    const session = {
      exportRecoverySnapshot: vi.fn(() => '{"save":"recoverable"}'),
      saveDevState: vi.fn(() => false),
    } as unknown as GameSession;
    let shouldThrow = true;
    function FaultySurface() {
      if (shouldThrow) throw new Error("render failed");
      return <p>game display restored</p>;
    }

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push({ root, container });
    await act(async () => {
      root.render(
        <SessionErrorBoundary session={session}>
          <FaultySurface />
        </SessionErrorBoundary>,
      );
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "your live game session is still available",
    );

    await clickButton(container, "export recovery");
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("recovery file exported");

    await clickButton(container, "reload game");
    expect(session.saveDevState).toHaveBeenCalledOnce();
    expect(container.textContent).toContain(
      "reload failed; export recovery and reload from the browser",
    );

    shouldThrow = false;
    await clickButton(container, "retry display");
    expect(container.textContent).toContain("game display restored");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:recovery");
  });
});

describe("RuntimeFailureWarning", () => {
  it("announces rolled-back actions and provides an explicit dismiss control", async () => {
    const onDismiss = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push({ root, container });
    await act(async () => {
      root.render(
        <RuntimeFailureWarning
          failure={{
            commandType: "world.move",
            message: "movement transaction failed",
            occurredAt: 123,
          }}
          onDismiss={onDismiss}
        />,
      );
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "game-state changes were undone",
    );
    expect(container.textContent).toContain(
      "world.move: movement transaction failed",
    );
    await clickButton(container, "dismiss");
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

function income(
  source: string,
  storeKey: string,
  amount: number,
): RoomStateSnapshot["income"][number] {
  return {
    source,
    store: storeKey,
    amount,
    delay: 10,
    text: `${amount > 0 ? "+" : ""}${amount} per 10s`,
  };
}

function store(
  key: string,
  value: number,
): RoomStateSnapshot["stores"][number] {
  return { key, value, category: "resources" };
}

async function clickButton(container: HTMLElement, name: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === name,
  );
  if (!button) throw new Error(`button not found: ${name}`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}
