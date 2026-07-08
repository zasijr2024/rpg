export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus<TEvents extends object> {
  private handlers = new Map<
    keyof TEvents,
    Set<EventHandler<TEvents[keyof TEvents]>>
  >();

  subscribe<TKey extends keyof TEvents>(
    eventName: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const existing = this.handlers.get(eventName) ?? new Set();
    existing.add(handler as EventHandler<TEvents[keyof TEvents]>);
    this.handlers.set(eventName, existing);

    return () => {
      existing.delete(handler as EventHandler<TEvents[keyof TEvents]>);
      if (existing.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  publish<TKey extends keyof TEvents>(
    eventName: TKey,
    payload: TEvents[TKey],
  ): void {
    const existing = this.handlers.get(eventName);
    if (!existing) return;
    for (const handler of [...existing]) {
      (handler as EventHandler<TEvents[TKey]>)(payload);
    }
  }
}
