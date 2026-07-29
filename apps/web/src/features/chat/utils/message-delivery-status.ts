import type { Chat, Message } from '../types';

export type MessageDeliveryStatus = 'pending' | 'sent' | 'read';

export interface MessageReadReceipt {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  readAt: string;
}

export interface MessageUnreadRecipient {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
}

/**
 * Own-message tick state:
 * - pending: still sending
 * - sent: delivered to server, peer has not read yet (1 tick)
 * - read: all other participants have lastReadAt >= message time (2 ticks)
 */
export function getMessageDeliveryStatus(
  message: Pick<Message, 'createdAt' | 'senderId'>,
  chat: Chat,
  currentUserId: string | undefined,
  isPending: boolean,
): MessageDeliveryStatus {
  if (isPending) return 'pending';
  if (!currentUserId || message.senderId !== currentUserId) return 'sent';

  const others = chat.participants.filter((participant) => participant.userId !== currentUserId);
  if (others.length === 0) return 'sent';

  const messageTime = new Date(message.createdAt).getTime();
  if (Number.isNaN(messageTime)) return 'sent';

  const allRead = others.every((participant) => {
    if (!participant.lastReadAt) return false;
    const readTime = new Date(participant.lastReadAt).getTime();
    return !Number.isNaN(readTime) && readTime >= messageTime;
  });

  return allRead ? 'read' : 'sent';
}

/**
 * Who has read this message (based on participant lastReadAt watermark).
 * `readAt` is when they last caught up in the chat (best available signal).
 */
export function getMessageReadReceipts(
  message: Pick<Message, 'createdAt' | 'senderId'>,
  chat: Chat,
): { seen: MessageReadReceipt[]; unseen: MessageUnreadRecipient[] } {
  const messageTime = new Date(message.createdAt).getTime();
  const seen: MessageReadReceipt[] = [];
  const unseen: MessageUnreadRecipient[] = [];

  for (const participant of chat.participants) {
    if (participant.userId === message.senderId) continue;

    const entry = {
      userId: participant.userId,
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      avatarUrl: participant.user.avatarUrl,
      role: participant.user.role,
    };

    if (!participant.lastReadAt || Number.isNaN(messageTime)) {
      unseen.push(entry);
      continue;
    }

    const readTime = new Date(participant.lastReadAt).getTime();
    if (!Number.isNaN(readTime) && readTime >= messageTime) {
      seen.push({ ...entry, readAt: participant.lastReadAt });
    } else {
      unseen.push(entry);
    }
  }

  seen.sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime());
  unseen.sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, {
      sensitivity: 'base',
    }),
  );

  return { seen, unseen };
}

export function canViewMessageReadReceipts(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'TEACHER';
}
