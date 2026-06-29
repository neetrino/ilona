import type { Chat } from '../../types';
import { formatDisplayName, getInitialsFromParts } from '../../utils/chat-utils';

export function getOtherParticipant(chat: Chat, currentUserId?: string) {
  if (chat.type === 'GROUP') return null;
  return chat.participants.find((p) => p.userId !== currentUserId) ?? null;
}

export function getChatTitle(chat: Chat, currentUserId: string | undefined, fallback: string) {
  if (chat.type === 'GROUP') {
    return chat.name || chat.group?.name || fallback;
  }
  const other = getOtherParticipant(chat, currentUserId);
  return other
    ? formatDisplayName(other.user.firstName, other.user.lastName) || fallback
    : fallback;
}

export function getChatAvatarUrl(chat: Chat, currentUserId?: string) {
  if (chat.type === 'GROUP') return null;
  const other = getOtherParticipant(chat, currentUserId);
  return other?.user.avatarUrl ?? null;
}

export function getChatAvatarInitials(
  chat: Chat,
  currentUserId: string | undefined,
  groupFallback: string,
) {
  if (chat.type === 'GROUP') {
    const name = chat.name || chat.group?.name || groupFallback;
    return name[0] || 'G';
  }
  const other = getOtherParticipant(chat, currentUserId);
  if (!other) return '?';
  return getInitialsFromParts(other.user.firstName, other.user.lastName);
}

export function getTypingNames(chat: Chat, typingUserIds: string[]) {
  return typingUserIds
    .map((id) => chat.participants.find((p) => p.userId === id)?.user.firstName)
    .filter((name): name is string => Boolean(name));
}
