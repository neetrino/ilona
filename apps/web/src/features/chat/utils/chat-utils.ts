import type { Message } from '../types';

export function formatDisplayName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== 'undefined');
  return parts.join(' ') || '';
}

export function getMessageSenderDisplay(
  message: Message,
  labels: { formerManager: string; inactiveManager: string; unknownUser: string },
): { name: string; isInactive: boolean } {
  if (message.sender) {
    const name = formatDisplayName(message.sender.firstName, message.sender.lastName);
    const isInactive = message.sender.status != null && message.sender.status !== 'ACTIVE';
    if (name) {
      return { name, isInactive };
    }
    if (message.sender.role === 'MANAGER' && isInactive) {
      return { name: labels.inactiveManager, isInactive: true };
    }
    return { name: labels.unknownUser, isInactive };
  }

  if (message.senderId) {
    return { name: labels.formerManager, isInactive: true };
  }

  return { name: labels.unknownUser, isInactive: false };
}

export function getInitialsFromParts(firstName?: string | null, lastName?: string | null): string {
  const first = (firstName ?? '').trim().charAt(0);
  const last = (lastName ?? '').trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || '?';
}

const CHAT_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/**
 * Format time for message display (24-hour, e.g. 14:18)
 */
export function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale, CHAT_TIME_FORMAT);
}

type DateSeparatorLabels = {
  today: string;
  yesterday: string;
};

/**
 * Format date separator for message grouping
 */
export function formatDateSeparator(
  dateStr: string,
  locale: string,
  labels: DateSeparatorLabels,
): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return labels.today;
  if (date.toDateString() === yesterday.toDateString()) return labels.yesterday;
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time for chat list sidebar
 */
export function formatChatListTime(
  dateStr: string | undefined,
  locale: string,
  yesterdayLabel: string,
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString(locale, CHAT_TIME_FORMAT);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return yesterdayLabel;
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString(locale, { weekday: 'short' });
  }

  if (date.getFullYear() !== now.getFullYear()) {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Check if should show date separator between messages
 */
export function shouldShowDateSeparator(message: Message, prevMessage?: Message): boolean {
  if (!prevMessage) return true;
  const currDate = new Date(message.createdAt).toDateString();
  const prevDate = new Date(prevMessage.createdAt).toDateString();
  return currDate !== prevDate;
}

export interface ChatListSortable {
  lastMessage?: { createdAt?: string } | null;
  lastMessageAt?: string | null;
  updatedAt?: string | null;
  unreadCount?: number | null;
}

export function getChatListActivityTime(item: ChatListSortable): number {
  if (item.lastMessageAt) {
    const time = new Date(item.lastMessageAt).getTime();
    if (!Number.isNaN(time)) return time;
  }
  if (item.lastMessage?.createdAt) {
    const time = new Date(item.lastMessage.createdAt).getTime();
    if (!Number.isNaN(time)) return time;
  }
  if (item.updatedAt) {
    const time = new Date(item.updatedAt).getTime();
    if (!Number.isNaN(time)) return time;
  }
  return 0;
}

/** Unread conversations first, then by most recent message activity. */
export function compareChatListItems(a: ChatListSortable, b: ChatListSortable): number {
  const aUnread = (a.unreadCount ?? 0) > 0 ? 1 : 0;
  const bUnread = (b.unreadCount ?? 0) > 0 ? 1 : 0;
  if (bUnread !== aUnread) return bUnread - aUnread;
  return getChatListActivityTime(b) - getChatListActivityTime(a);
}

export function sortChatListItems<T>(
  items: T[],
  pickSortable: (item: T) => ChatListSortable,
): T[] {
  return [...items].sort((a, b) =>
    compareChatListItems(pickSortable(a), pickSortable(b)),
  );
}

