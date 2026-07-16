import type { Prisma, MessageType } from '@ilona/database';

export interface SendMessageResponse {
  id: string;
  chatId: string;
  senderId: string | null;
  content: string | null;
  type: MessageType;
  metadata?: Prisma.JsonValue;
  fileUrl?: string | null;
  isEdited?: boolean;
  createdAt: Date;
  updatedAt: Date;
  navigation?: { conversationId: string; groupId: string; messageId: string };
}

export interface AdminStudentRecordingFilters {
  /** @deprecated Prefer groupIds */
  groupId?: string;
  /** @deprecated Prefer studentIds (user ids) */
  studentUserId?: string;
  groupIds?: string[];
  /** Student user ids (message sender ids) */
  studentIds?: string[];
  search?: string;
  /** Optional offset for incremental loading */
  skip?: number;
  /** Optional page size for incremental loading */
  take?: number;
}

export type MessageWithChatForRecordings = Prisma.MessageGetPayload<{
  include: {
    chat: {
      include: {
        participants: {
          include: {
            user: {
              select: { id: true; firstName: true; lastName: true };
            };
          };
        };
      };
    };
  };
}>;
