import { formatDisplayName } from '@/shared/components/ui/avatar';
import type { Message } from './types';

/**
 * Partial message type for teacher groups/students that may not have all fields
 */
type PartialMessage = {
  type?: string;
  content?: string | null;
  fileName?: string | null;
  isSystem?: boolean;
  senderId?: string;
  sender?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
} | null | undefined;

export type MessagePreviewLabels = {
  noMessagesYet: string;
  voiceMessage: string;
  photo: string;
  video: string;
  attachment: string;
  systemMessage: string;
  message: string;
};

/**
 * Formats a message preview for display in the chat list sidebar.
 * Handles different message types (text, voice, file, image, etc.)
 */
export function formatMessagePreview(
  message: Message | PartialMessage,
  labels: MessagePreviewLabels,
): string {
  if (!message) {
    return labels.noMessagesYet;
  }

  const messageType = (message as Message).type || (message as PartialMessage)?.type;

  if (messageType === 'TEXT' && message.content) {
    const maxLength = 50;
    return message.content.length > maxLength
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
  }

  if (messageType === 'VOICE') {
    return labels.voiceMessage;
  }

  if (messageType === 'IMAGE') {
    return labels.photo;
  }

  if (messageType === 'VIDEO') {
    return labels.video;
  }

  if (messageType === 'FILE') {
    const fileName = (message as Message).fileName || (message as PartialMessage)?.fileName;
    return fileName ? `📎 ${fileName}` : labels.attachment;
  }

  if ((message as Message).isSystem || (message as PartialMessage)?.isSystem) {
    return message.content || labels.systemMessage;
  }

  if (message.content) {
    const maxLength = 50;
    return message.content.length > maxLength
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
  }

  return labels.message;
}

export type ChatListPreviewOptions = {
  message: Message | PartialMessage;
  labels: MessagePreviewLabels;
  unreadCount?: number;
  /** Pre-formatted via t('unreadCount', { count }) */
  unreadLabel?: string;
  isGroup?: boolean;
  currentUserId?: string | null;
  /** Fallback when there is no message (e.g. phone) */
  emptyFallback?: string;
};

/**
 * Chat list subtitle: shows unread count + optional sender (groups) + preview.
 * Example: "3 չկարդացված · Admin User: Hello"
 */
export function formatChatListPreview(options: ChatListPreviewOptions): string {
  const {
    message,
    labels,
    unreadCount = 0,
    unreadLabel,
    isGroup = false,
    currentUserId,
    emptyFallback,
  } = options;

  if (!message) {
    if (unreadCount > 0 && unreadLabel) return unreadLabel;
    return emptyFallback || labels.noMessagesYet;
  }

  let preview = formatMessagePreview(message, labels);
  const sender = message.sender;
  const senderId = message.senderId ?? sender?.id;
  if (isGroup && sender && senderId && senderId !== currentUserId) {
    const senderName = formatDisplayName(sender.firstName, sender.lastName);
    if (senderName) {
      preview = `${senderName}: ${preview}`;
    }
  }

  if (unreadCount > 0 && unreadLabel) {
    return `${unreadLabel} · ${preview}`;
  }

  return preview;
}
