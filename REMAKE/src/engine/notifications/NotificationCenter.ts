export interface GameNotification {
  id: number;
  source: string;
  message: string;
  createdAt: number;
}

export interface NotificationCenterSnapshot {
  nextId: number;
  items: GameNotification[];
}

export class NotificationCenter {
  private nextId = 1;
  private items: GameNotification[] = [];

  constructor(
    private readonly now: () => number,
    private readonly maxItems = 200,
  ) {}

  notify(source: string, message: string): GameNotification {
    const notification: GameNotification = {
      id: this.nextId++,
      source,
      message,
      createdAt: this.now(),
    };
    this.items.push(notification);
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(this.items.length - this.maxItems);
    }
    return notification;
  }

  list(source?: string): GameNotification[] {
    const items =
      source === undefined
        ? this.items
        : this.items.filter((notification) => notification.source === source);
    return [...items];
  }

  clear(): void {
    this.items = [];
  }

  snapshot(): NotificationCenterSnapshot {
    return {
      nextId: this.nextId,
      items: this.list(),
    };
  }

  restore(snapshot: NotificationCenterSnapshot): void {
    this.nextId = Math.max(1, snapshot.nextId);
    this.items = snapshot.items
      .slice(-this.maxItems)
      .map((item) => ({ ...item }));
  }
}
