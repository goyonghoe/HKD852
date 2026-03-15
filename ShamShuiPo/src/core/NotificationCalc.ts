// NotificationCalc.ts — pure TypeScript, NO Phaser imports

export type NotificationType =
  | "info"
  | "warning"
  | "success"
  | "error"
  | "achievement"
  | "loot";

export interface Notification {
  readonly id: number;
  readonly type: NotificationType;
  readonly message: string;
  readonly timestamp: number;
  readonly duration: number;
  readonly priority: number;
  readonly read: boolean;
}

export interface NotificationState {
  readonly notifications: readonly Notification[];
  readonly nextId: number;
  readonly maxNotifications: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createNotificationState(
  maxNotifications = 50,
): NotificationState {
  return {
    notifications: [],
    nextId: 1,
    maxNotifications: Math.max(1, maxNotifications),
  };
}

// ---------------------------------------------------------------------------
// Add
// ---------------------------------------------------------------------------

export function addNotification(
  state: NotificationState,
  type: NotificationType,
  message: string,
  duration = 3000,
  priority = 0,
): NotificationState {
  const notification: Notification = {
    id: state.nextId,
    type,
    message,
    timestamp: Date.now(),
    duration,
    priority,
    read: false,
  };

  let notifications = [...state.notifications, notification];

  // Trim oldest (lowest index) if over capacity
  if (notifications.length > state.maxNotifications) {
    notifications = notifications.slice(
      notifications.length - state.maxNotifications,
    );
  }

  return {
    ...state,
    notifications,
    nextId: state.nextId + 1,
  };
}

// ---------------------------------------------------------------------------
// Dismiss
// ---------------------------------------------------------------------------

export function dismissNotification(
  state: NotificationState,
  id: number,
): NotificationState {
  const filtered = state.notifications.filter((n) => n.id !== id);
  if (filtered.length === state.notifications.length) return state;
  return {
    ...state,
    notifications: filtered,
  };
}

// ---------------------------------------------------------------------------
// Mark as Read
// ---------------------------------------------------------------------------

export function markAsRead(
  state: NotificationState,
  id: number,
): NotificationState {
  const idx = state.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return state;
  if (state.notifications[idx].read) return state;

  const updated = state.notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );

  return {
    ...state,
    notifications: updated,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getActiveNotifications(
  state: NotificationState,
  currentTime: number,
): Notification[] {
  return state.notifications.filter(
    (n) => n.timestamp + n.duration > currentTime,
  );
}

export function getByType(
  state: NotificationState,
  type: NotificationType,
): Notification[] {
  return state.notifications.filter((n) => n.type === type);
}

export function getUnreadCount(state: NotificationState): number {
  return state.notifications.filter((n) => !n.read).length;
}

export function getHighPriority(
  state: NotificationState,
  minPriority: number,
): Notification[] {
  return state.notifications.filter((n) => n.priority >= minPriority);
}

export function getLatestN(
  state: NotificationState,
  n: number,
): Notification[] {
  if (n <= 0) return [];
  return state.notifications.slice(-n);
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export function clearAll(state: NotificationState): NotificationState {
  if (state.notifications.length === 0) return state;
  return {
    ...state,
    notifications: [],
  };
}

export function clearExpired(
  state: NotificationState,
  currentTime: number,
): NotificationState {
  const kept = state.notifications.filter(
    (n) => n.timestamp + n.duration > currentTime,
  );
  if (kept.length === state.notifications.length) return state;
  return {
    ...state,
    notifications: kept,
  };
}
