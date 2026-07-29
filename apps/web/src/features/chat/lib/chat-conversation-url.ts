import type { Chat } from '../types';
import { formatDisplayName } from '../utils/chat-utils';

/** Human-readable conversation key in the URL (group name or person full name). */
export const CHAT_CONVERSATION_PARAM = 'conversation';

/** Legacy params — still accepted when reading old links. */
export const CHAT_CONVERSATION_ID_PARAM = 'conversationId';
export const CHAT_ID_PARAM = 'chatId';

const CUID_LIKE = /^c[a-z0-9]{20,}$/i;

export function isLikelyChatId(value: string): boolean {
  return CUID_LIKE.test(value.trim());
}

function getOtherParticipant(chat: Chat, currentUserId?: string) {
  if (chat.type === 'GROUP') return null;
  return chat.participants.find((p) => p.userId !== currentUserId) ?? null;
}

export function getChatConversationLabel(chat: Chat, currentUserId?: string): string {
  if (chat.type === 'GROUP') {
    return (chat.name || chat.group?.name || '').trim();
  }
  const other = getOtherParticipant(chat, currentUserId);
  if (!other) return '';
  return formatDisplayName(other.user.firstName, other.user.lastName).trim();
}

/** Turns a display label into a stable URL-friendly slug (keeps Unicode letters). */
export function toConversationSlug(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeConversationSlug(slug: string): string {
  try {
    return toConversationSlug(decodeURIComponent(slug)).toLocaleLowerCase();
  } catch {
    return toConversationSlug(slug).toLocaleLowerCase();
  }
}

export function buildChatConversationSlug(
  chat: Chat,
  currentUserId?: string,
  peers: Chat[] = [],
): string {
  const label = getChatConversationLabel(chat, currentUserId);
  const base = toConversationSlug(label || chat.id);
  if (!base) return chat.id;

  const normalizedBase = base.toLocaleLowerCase();
  const hasCollision = peers.some(
    (peer) =>
      peer.id !== chat.id &&
      toConversationSlug(getChatConversationLabel(peer, currentUserId)).toLocaleLowerCase() ===
        normalizedBase,
  );

  if (!hasCollision) return base;
  return `${base}--${chat.id.slice(-6)}`;
}

export function findChatByConversationSlug(
  chats: Chat[],
  slug: string,
  currentUserId?: string,
): Chat | undefined {
  const normalized = normalizeConversationSlug(slug);
  if (!normalized) return undefined;

  const suffixMatch = normalized.match(/^(.*)--([a-z0-9]{6})$/i);
  if (suffixMatch) {
    const [, base, suffix] = suffixMatch;
    const bySuffix = chats.find(
      (chat) =>
        chat.id.toLocaleLowerCase().endsWith(suffix) &&
        toConversationSlug(getChatConversationLabel(chat, currentUserId)).toLocaleLowerCase() ===
          base,
    );
    if (bySuffix) return bySuffix;
  }

  return chats.find(
    (chat) =>
      toConversationSlug(getChatConversationLabel(chat, currentUserId)).toLocaleLowerCase() ===
      normalized,
  );
}

export function readConversationParam(
  readParam: (key: string) => string | null,
): { kind: 'slug' | 'id'; value: string } | null {
  const slug = readParam(CHAT_CONVERSATION_PARAM)?.trim();
  if (slug) {
    return { kind: isLikelyChatId(slug) ? 'id' : 'slug', value: slug };
  }

  const legacyId =
    readParam(CHAT_CONVERSATION_ID_PARAM)?.trim() || readParam(CHAT_ID_PARAM)?.trim();
  if (legacyId) {
    return { kind: 'id', value: legacyId };
  }

  return null;
}

export function setConversationSearchParam(
  params: URLSearchParams,
  chat: Chat,
  currentUserId?: string,
  peers: Chat[] = [],
): void {
  params.delete(CHAT_CONVERSATION_ID_PARAM);
  params.delete(CHAT_ID_PARAM);
  params.set(CHAT_CONVERSATION_PARAM, buildChatConversationSlug(chat, currentUserId, peers));
}

export function clearConversationSearchParams(params: URLSearchParams): void {
  params.delete(CHAT_CONVERSATION_PARAM);
  params.delete(CHAT_CONVERSATION_ID_PARAM);
  params.delete(CHAT_ID_PARAM);
}

export function chatMatchesConversationParam(
  chat: Chat,
  param: { kind: 'slug' | 'id'; value: string },
  currentUserId?: string,
  peers: Chat[] = [],
): boolean {
  if (param.kind === 'id') {
    return chat.id === param.value;
  }
  return (
    normalizeConversationSlug(buildChatConversationSlug(chat, currentUserId, peers)) ===
    normalizeConversationSlug(param.value)
  );
}
