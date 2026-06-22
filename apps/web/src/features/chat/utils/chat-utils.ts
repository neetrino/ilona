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

/**
 * Format time for message display
 */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date separator for message grouping
 */
export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
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

