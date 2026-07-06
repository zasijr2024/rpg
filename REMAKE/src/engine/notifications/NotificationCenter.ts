export interface GameNotification {
  id: number;
  source: string;
  message: string;
  createdAt: number;
}

export class NotificationCenter {
  private nextId = 1;
  private items: GameNotification[] = [];

  constructor(private readonly now: () => number) {}

  notify(source: string, message: string): GameNotification {
    const notification: GameNotification = {
      id: this.nextId++,
      source,
      message,
      createdAt: this.now()
    };
    this.items.push(notification);
    return notification;
  }

  list(): GameNotification[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}

