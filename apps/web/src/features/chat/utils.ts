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

/**
 * Formats a message preview for display in the chat list sidebar.
 * Handles different message types (text, voice, file, image, etc.)
 */
export function formatMessagePreview(message: Message | PartialMessage): string {
  if (!message) {
    return 'No messages yet';
  }

  const messageType = (message as Message).type || (message as any).type;

  // Text messages
  if (messageType === 'TEXT' && message.content) {
    // Truncate long messages
    const maxLength = 50;
    return message.content.length > maxLength
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
  }

  // Voice messages
  if (messageType === 'VOICE') {
    return 'Voice message';
  }

  // Image messages
  if (messageType === 'IMAGE') {
    return 'Photo';
  }

  // Video messages
  if (messageType === 'VIDEO') {
    return 'Video';
  }

  // File messages
  if (messageType === 'FILE') {
    const fileName = (message as Message).fileName || (message as any).fileName;
    return fileName ? `📎 ${fileName}` : 'Attachment';
  }

  // System messages (should be filtered out, but handle gracefully)
  if ((message as Message).isSystem || (message as any).isSystem) {
    return message.content || 'System message';
  }

  // Fallback: if we have content, use it (might be a text message without type specified)
  if (message.content) {
    const maxLength = 50;
    return message.content.length > maxLength
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
  }

  // Final fallback
  return 'Message';
}

