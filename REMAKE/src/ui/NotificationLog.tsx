import type { CSSProperties } from "react";
import type { GameNotification } from "../engine";

interface NotificationLogProps {
  label: string;
  notifications: GameNotification[];
}

const MAX_VISIBLE_NOTIFICATIONS = 8;

export function NotificationLog({
  label,
  notifications,
}: NotificationLogProps) {
  const visibleNotifications = notifications
    .slice(-MAX_VISIBLE_NOTIFICATIONS)
    .reverse();

  if (visibleNotifications.length === 0) return null;

  return (
    <section
      className="notificationsPanel"
      aria-label={label}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
    >
      {visibleNotifications.map((notification, index) => (
        <p
          key={notification.id}
          style={{ "--notification-age": index } as CSSProperties}
        >
          {notification.message}
        </p>
      ))}
    </section>
  );
}
