import type { Chat, Message } from '../types';

export type MessageDeliveryStatus = 'pending' | 'sent' | 'read';

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
