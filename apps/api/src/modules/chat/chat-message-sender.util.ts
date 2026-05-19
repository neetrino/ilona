/** Public sender fields returned with chat messages (includes inactive authors). */
export const chatSenderPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  role: true,
  status: true,
} as const;

export type ChatSenderPublic = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
};

export type MessageWithOptionalSender = {
  senderId: string | null;
  sender?: ChatSenderPublic | null;
};

/** Ensures API responses always include sender identity for historical messages. */
export function mapMessageWithSender<T extends MessageWithOptionalSender>(message: T): T {
  if (!message.senderId) {
    return { ...message, sender: message.sender ?? null };
  }

  if (message.sender) {
    return message;
  }

  return {
    ...message,
    sender: {
      id: message.senderId,
      firstName: 'Unknown',
      lastName: 'User',
      avatarUrl: null,
      role: 'MANAGER',
      status: 'INACTIVE',
    },
  };
}
