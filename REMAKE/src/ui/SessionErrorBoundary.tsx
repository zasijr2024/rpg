import { Component, type ReactNode } from "react";
import type { GameSession } from "../engine";
import { LegalFooter } from "./LegalFooter";
import { downloadRecoverySnapshot } from "./PersistenceWarning";
import { RecoveryImport } from "./RecoveryImport";

interface SessionErrorBoundaryProps {
  children: ReactNode;
  session?: GameSession;
}

interface SessionErrorBoundaryState {
  failed: boolean;
  exportStatus: "idle" | "exported" | "unavailable" | "reload-failed";
}

/**
 * Contains unexpected UI failures while keeping the live GameSession available
 * for a retry, a recovery export, or a persistence-aware reload.
 */
export class SessionErrorBoundary extends Component<
  SessionErrorBoundaryProps,
  SessionErrorBoundaryState
> {
  state: SessionErrorBoundaryState = {
    failed: false,
    exportStatus: "idle",
  };

  static getDerivedStateFromError(): Partial<SessionErrorBoundaryState> {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const session = this.props.session;
    return (
      <main className="appShell sessionErrorShell" aria-label="A Dark Room">
        <section
          className="lazyRouteError sessionError"
          role="alert"
          aria-labelledby="session-error-title"
        >
          <h1 id="session-error-title">the game display stopped</h1>
          <p>
            {session
              ? "your live game session is still available."
              : "the game could not start."}{" "}
            retry the display or reload the game.
          </p>
          <div className="lazyRouteErrorActions">
            <button
              type="button"
              onClick={() =>
                this.setState({ failed: false, exportStatus: "idle" })
              }
            >
              retry display
            </button>
            {session && (
              <button
                type="button"
                onClick={() => {
                  this.setState({
                    exportStatus: downloadRecoverySnapshot(session)
                      ? "exported"
                      : "unavailable",
                  });
                }}
              >
                export recovery
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                try {
                  if (session && !session.saveDevState()) {
                    this.setState({ exportStatus: "reload-failed" });
                    return;
                  }
                  window.location.reload();
                } catch {
                  this.setState({ exportStatus: "reload-failed" });
                }
              }}
            >
              reload game
            </button>
          </div>
          {this.state.exportStatus !== "idle" && (
            <p className="sessionErrorStatus" role="status">
              {this.state.exportStatus === "exported"
                ? "recovery file exported"
                : this.state.exportStatus === "reload-failed"
                  ? "reload failed; export recovery and reload from the browser"
                  : "no recovery snapshot is available yet"}
            </p>
          )}
        </section>
        {session && <RecoveryImport session={session} />}
        <LegalFooter />
      </main>
    );
  }
}
