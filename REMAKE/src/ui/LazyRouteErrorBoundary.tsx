import { Component, type ReactNode } from "react";
import type { GameLocationKey } from "../engine";

interface LazyRouteErrorBoundaryProps {
  children: ReactNode;
  location: Extract<GameLocationKey, "fabricator" | "ship" | "space">;
  onLeave: () => void;
  onReload: () => void;
  onRetry: () => void;
}

interface LazyRouteErrorBoundaryState {
  failed: boolean;
}

/** Contains failed late-game route imports without replacing the live session. */
export class LazyRouteErrorBoundary extends Component<
  LazyRouteErrorBoundaryProps,
  LazyRouteErrorBoundaryState
> {
  state: LazyRouteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): LazyRouteErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section
        className="lazyRouteError"
        role="alert"
        aria-labelledby="lazy-route-error-title"
      >
        <h2 id="lazy-route-error-title">
          {this.props.location} could not be loaded
        </h2>
        <p>
          your game is still available. retry this location when its files can
          be reached, reload the game, or return to the room.
        </p>
        <div className="lazyRouteErrorActions">
          <button type="button" onClick={this.props.onRetry}>
            retry location
          </button>
          <button type="button" onClick={this.props.onReload}>
            reload game
          </button>
          <button type="button" onClick={this.props.onLeave}>
            return to room
          </button>
        </div>
      </section>
    );
  }
}
