import type { Message } from './types';

/**
 * Partial message type for teacher groups/students that may not have all fields
 */
type PartialMessage = {
  type?: string;
  content?: string | null;
  fileName?: string | null;
  isSystem?: boolean;
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
