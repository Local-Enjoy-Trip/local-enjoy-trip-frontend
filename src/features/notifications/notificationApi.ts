import { apiGet } from "@/shared/api/http";

export type NotificationType = "FRIEND_REQUEST_RECEIVED";
export type NotificationReferenceType = "FRIENDSHIP";

export type Notification = {
  createdAt: string;
  id: number;
  payload: string;
  read: boolean;
  readAt?: string | null;
  referenceId: number;
  referenceType: NotificationReferenceType;
  type: NotificationType;
};

type NotificationsResponse = {
  notifications: Notification[];
};

type NotificationUnreadStatusResponse = {
  hasUnread: boolean;
};

export const notificationsQueryKey = ["notifications"] as const;
export const notificationUnreadStatusQueryKey = [
  "notifications",
  "unread-status",
] as const;

export function getNotifications(limit = 50) {
  return apiGet<NotificationsResponse>(
    `/api/notifications?limit=${limit}`,
  ).then((response) => response.notifications);
}

export function getNotificationUnreadStatus() {
  return apiGet<NotificationUnreadStatusResponse>(
    "/api/notifications/unread-status",
  );
}
