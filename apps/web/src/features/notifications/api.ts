import { api } from '@/shared/lib/api';
import type { NotificationListResponse, NotificationUnreadCount } from '@ilona/types';

const ENDPOINT = '/notifications';

export async function fetchNotifications(cursor?: string): Promise<NotificationListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return api.get<NotificationListResponse>(`${ENDPOINT}${query}`);
}

export async function fetchNotificationUnreadCount(): Promise<NotificationUnreadCount> {
  return api.get<NotificationUnreadCount>(`${ENDPOINT}/unread-count`);
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return api.patch<{ ok: true }>(`${ENDPOINT}/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  return api.patch<{ ok: true }>(`${ENDPOINT}/read-all`);
}
