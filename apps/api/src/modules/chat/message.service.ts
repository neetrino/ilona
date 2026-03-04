import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MessageType, ChatType, UserRole } from '@ilona/database';
import { SendMessageDto, UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { SalariesService } from '../finance/salaries.service';
import { ChatManagementService } from './chat-management.service';
import { ChatAuthorizationService } from './chat-authorization.service';

/** Message response with optional navigation (e.g. for voice from calendar) */
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

/**
 * Service responsible for message operations
 */
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
    private readonly chatManagementService: ChatManagementService,
    private readonly authorizationService: ChatAuthorizationService,
  ) {}

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    chatId: string,
    userId: string,
    params?: { cursor?: string; take?: number },
    userRole?: string,
  ) {
    // Verify user is participant
    await this.chatManagementService.getChatById(chatId, userId, userRole);

    const { cursor, take = 50 } = params || {};

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        // Filter out soft-deleted messages (content === null && isSystem === true)
        // With hard delete, messages are completely removed, but we filter old soft-deleted ones
        NOT: {
          AND: [
            { content: null },
            { isSystem: true },
          ],
        },
      },
      take: take + 1, // Get one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items: items.reverse(), // Return in chronological order
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  /**
   * Send a message.
   * SECURITY: senderId must ONLY be passed from the controller/gateway (from authenticated
   * user). Never use or trust any senderId from dto - the DTO does not include it by design.
   */
  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string): Promise<SendMessageResponse> {
    // CRITICAL: senderId must come from auth layer only (never from request body)
    if (!senderId || senderId.trim() === '') {
      this.logger.error('[sendMessage] senderId is missing or empty', { dto });
      throw new BadRequestException('Sender ID is required');
    }

    // CRITICAL: Verify senderId matches a valid user in the database (re-validate per request)
    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, role: true, status: true, email: true },
    });

    if (!senderUser) {
      this.logger.error('[sendMessage] senderId does not match any user', { senderId, dto });
      throw new BadRequestException('Invalid sender ID');
    }

    if (senderUser.status !== 'ACTIVE') {
      this.logger.error('[sendMessage] sender user is not active', { senderId, status: senderUser.status });
      throw new ForbiddenException('Sender account is not active');
    }

    // CRITICAL: If senderRole is provided, verify it matches the user's actual role
    if (senderRole && senderUser.role !== senderRole) {
      this.logger.error(
        '[sendMessage] senderRole mismatch - potential security issue',
        { senderId, providedRole: senderRole, actualRole: senderUser.role, email: senderUser.email }
      );
      throw new ForbiddenException('Sender role mismatch');
    }

    // Log for debugging (dev only)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug('[sendMessage] Creating message', {
        senderId,
        senderRole: senderUser.role,
        senderEmail: senderUser.email,
        chatId: dto.chatId,
      });
    }

    // Verify user is participant (or admin for group chats)
    const chat = await this.chatManagementService.getChatById(dto.chatId, senderId, senderUser.role);

    // Validate VOICE message: require fileUrl and enforce duration/size limits
    const messageType = dto.type || MessageType.TEXT;
    if (messageType === MessageType.VOICE) {
      if (!dto.fileUrl || typeof dto.fileUrl !== 'string' || !dto.fileUrl.trim()) {
        throw new BadRequestException('Voice messages require an audio file URL');
      }
      const duration = dto.duration ?? 0;
      if (duration < 1 || duration > 600) {
        throw new BadRequestException('Voice message duration must be between 1 and 600 seconds');
      }
      const maxVoiceSizeBytes = 10 * 1024 * 1024; // 10MB
      if (dto.fileSize != null && dto.fileSize > maxVoiceSizeBytes) {
        throw new BadRequestException('Voice message file size exceeds the maximum allowed (10MB)');
      }
    }

    // voiceToTeacher: only students can set this, and only in direct chat with their teacher
    const metadataObj = dto.metadata && typeof dto.metadata === 'object' ? (dto.metadata) : null;
    if (metadataObj?.voiceToTeacher === true) {
      if (senderUser.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can send voice messages to teacher');
      }
      if (chat.type !== ChatType.DIRECT) {
        throw new BadRequestException('Voice to teacher can only be sent in a direct chat with your teacher');
      }
      const otherParticipantForVoice = chat.participants.find((p) => p.userId !== senderId);
      const otherUserForVoice = otherParticipantForVoice
        ? await this.prisma.user.findUnique({ where: { id: otherParticipantForVoice.userId }, select: { role: true } })
        : null;
      if (otherUserForVoice?.role !== UserRole.TEACHER) {
        throw new BadRequestException('Voice to teacher must be sent to your assigned teacher');
      }
    }

    // Additional permission check for direct chats: validate student-teacher relationship
    // Admin ↔ Teacher and Admin ↔ Student messaging is always allowed
    if (chat.type === ChatType.DIRECT) {
      // Use senderUser we already fetched above instead of querying again
      const sender = senderUser;
      
      // Find the other participant
      const otherParticipant = chat.participants.find((p) => p.userId !== senderId);
      if (otherParticipant) {
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherParticipant.userId },
          select: { role: true },
        });

        // Allow Admin ↔ Teacher and Admin ↔ Student messaging (no validation needed)
        const isAdminInvolved = sender.role === UserRole.ADMIN || otherUser?.role === UserRole.ADMIN;
        
        if (!isAdminInvolved) {
          // If student is sending to teacher, validate assignment
          if (sender.role === UserRole.STUDENT && otherUser?.role === UserRole.TEACHER) {
            const canDM = await this.authorizationService.validateStudentTeacherDM(senderId, otherParticipant.userId);
            if (!canDM) {
              throw new ForbiddenException('You can only message teachers assigned to you');
            }
          }

          // If teacher is sending to student, validate assignment
          if (sender.role === UserRole.TEACHER && otherUser?.role === UserRole.STUDENT) {
            const canDM = await this.authorizationService.validateStudentTeacherDM(otherParticipant.userId, senderId);
            if (!canDM) {
              throw new ForbiddenException('You can only message students assigned to you');
            }
          }
        }
      }
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId,
        type: messageType,
        content: dto.content,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        duration: dto.duration,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Update chat's updatedAt
    await this.prisma.chat.update({
      where: { id: dto.chatId },
      data: { updatedAt: new Date() },
    });

    // Auto-mark lesson obligations if metadata contains lessonId
    if (dto.metadata && typeof dto.metadata === 'object' && 'lessonId' in dto.metadata) {
      const lessonId = dto.metadata.lessonId as string;
      const messageType = dto.type || MessageType.TEXT;

      // Mark voice or text as sent based on message type
      if (messageType === MessageType.VOICE) {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: lessonId },
          select: { teacherId: true, scheduledAt: true, voiceSent: true },
        }).catch(() => null);

        if (lesson && !lesson.voiceSent) {
          await this.prisma.lesson.update({
            where: { id: lessonId },
            data: {
              voiceSent: true,
              voiceSentAt: new Date(),
            },
          }).catch(() => {
            // Silently fail if lesson doesn't exist or update fails
          });

          // Trigger salary recalculation if this is a new completion
          if (lesson.scheduledAt) {
            const lessonMonth = new Date(lesson.scheduledAt);
            await this.salariesService.recalculateSalaryForMonth(
              lesson.teacherId,
              lessonMonth,
            ).catch(() => {
              // Silently fail to avoid breaking message sending
            });
          }
        }
      } else if (messageType === MessageType.TEXT && dto.metadata.fromLessonDetail) {
        // Only mark text as sent if it's explicitly from lesson detail page
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: lessonId },
          select: { teacherId: true, scheduledAt: true, textSent: true },
        }).catch(() => null);

        if (lesson && !lesson.textSent) {
          await this.prisma.lesson.update({
            where: { id: lessonId },
            data: {
              textSent: true,
              textSentAt: new Date(),
            },
          }).catch(() => {
            // Silently fail if lesson doesn't exist or update fails
          });

          // Trigger salary recalculation if this is a new completion
          if (lesson.scheduledAt) {
            const lessonMonth = new Date(lesson.scheduledAt);
            await this.salariesService.recalculateSalaryForMonth(
              lesson.teacherId,
              lessonMonth,
            ).catch(() => {
              // Silently fail to avoid breaking message sending
            });
          }
        }
      }
    }

    // Return message with navigation metadata for voice messages from calendar
    const response: SendMessageResponse = {
      ...message,
      ...(chat.groupId && {
        navigation: {
          conversationId: chat.id,
          groupId: chat.groupId,
          messageId: message.id,
        },
      }),
    };
    return response;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, dto: UpdateMessageDto, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Only text messages can be edited');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Delete a message (hard delete - completely remove from database)
   * Also deletes associated file from storage if it exists
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Delete file from storage if it exists
    if (message.fileUrl) {
      try {
        // Extract key from fileUrl
        // For R2 URLs: https://pub-xxx.r2.dev/chat/filename.webm -> chat/filename.webm
        // For R2 URLs with voice folder: https://pub-xxx.r2.dev/chat/voice/filename.webm -> chat/voice/filename.webm
        // For local storage: http://localhost:4000/api/storage/file/chat/filename.webm -> chat/filename.webm
        let key: string | undefined;
        
        const fileUrl = message.fileUrl;
        
        // Try to parse as URL first (works for both .r2.dev and custom domains)
        try {
          const url = new URL(fileUrl);
          // Extract pathname and remove leading slash
          const pathname = url.pathname;
          if (pathname && pathname.length > 1) {
            key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
            // Validate that it looks like a storage key (starts with chat/, avatars/, or documents/)
            if (key && !key.match(/^(chat|avatars|documents)\//)) {
              // If it doesn't match expected pattern, try regex extraction
              const match = fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
              if (match && match[0]) {
                key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
              } else {
                key = undefined; // Reset if pattern doesn't match
              }
            }
          }
        } catch (urlError) {
          // If URL parsing fails, try regex extraction
          const match = fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
          if (match && match[0]) {
            key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
          }
        }
        
        // If still no key, try other patterns
        if (!key) {
          if (fileUrl.includes('/api/storage/file/')) {
            // Local storage URL
            const parts = fileUrl.split('/api/storage/file/');
            if (parts.length > 1) {
              key = decodeURIComponent(parts[1]);
            }
          } else if (fileUrl.includes('/api/storage/proxy')) {
            // Proxy URL - extract from query parameter
            try {
              const url = new URL(fileUrl);
              const urlParam = url.searchParams.get('url');
              if (urlParam) {
                // Recursively extract from the proxied URL (works for both .r2.dev and custom domains)
                const proxiedUrl = decodeURIComponent(urlParam);
                try {
                  const proxiedUrlObj = new URL(proxiedUrl);
                  const pathname = proxiedUrlObj.pathname;
                  if (pathname && pathname.length > 1) {
                    key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
                  }
                } catch {
                  // If proxied URL parsing fails, try regex
                  const match = proxiedUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
                  if (match && match[0]) {
                    key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
                  }
                }
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }

        if (key) {
          // Log for debugging
          this.logger.log(`Deleting file from storage. Key: ${key}, Original URL: ${fileUrl}`);
          
          await this.storageService.delete(key).then(() => {
            this.logger.log(`Successfully deleted file from storage: ${key}`);
          }).catch((err: unknown) => {
            // Log error but don't fail the message deletion
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to delete file from storage. Key: ${key}, Error: ${msg}`);
          });
        } else {
          this.logger.warn(`Could not extract key from fileUrl: ${fileUrl}`);
        }
      } catch (error) {
        // Log error but don't fail the message deletion
        this.logger.error(`Error processing file deletion: ${error instanceof Error ? error.message : String(error)}, FileUrl: ${message.fileUrl}`);
      }
    }

    // Hard delete - completely remove from database
    const deletedMessage = await this.prisma.message.delete({
      where: { id: messageId },
    });

    return deletedMessage;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, userId: string) {
    await this.prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Send vocabulary message (special feature for teachers)
   */
  async sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]) {
    // CRITICAL: Validate teacherId is provided and not empty
    if (!teacherId || teacherId.trim() === '') {
      this.logger.error('[sendVocabularyMessage] teacherId is missing or empty', { chatId });
      throw new BadRequestException('Teacher ID is required');
    }

    // CRITICAL: Verify teacherId matches a valid user in the database
    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true, status: true, email: true },
    });

    if (!teacherUser) {
      this.logger.error('[sendVocabularyMessage] teacherId does not match any user', { teacherId, chatId });
      throw new BadRequestException('Invalid teacher ID');
    }

    if (teacherUser.status !== 'ACTIVE') {
      this.logger.error('[sendVocabularyMessage] teacher user is not active', { teacherId, status: teacherUser.status });
      throw new ForbiddenException('Teacher account is not active');
    }

    // Verify teacher is participant and is admin
    const chat = await this.chatManagementService.getChatById(chatId, teacherId, teacherUser.role);
    const participant = chat.participants.find((p) => p.userId === teacherId);
    
    if (!participant?.isAdmin) {
      throw new ForbiddenException('Only chat admins can send vocabulary');
    }

    // Create vocabulary message
    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: teacherId,
        type: MessageType.TEXT,
        content: `📚 **Vocabulary for Today:**\n\n${vocabularyWords.map((word, i) => `${i + 1}. ${word}`).join('\n')}`,
        metadata: {
          isVocabulary: true,
          words: vocabularyWords,
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get voice messages sent by a student to their teacher (for Recordings section).
   * Student-only; returns messages with metadata.voiceToTeacher === true.
   * Optional filters: year, month, day (UTC) filter by createdAt.
   *
   * RETENTION: Student Recordings have no expiration. They are retained indefinitely
   * until manually deleted by the student or admin. Do not add TTL, expiresAt, or
   * date-based filters here; do not add cron/cleanup jobs that delete these recordings.
   */
  async getStudentVoiceToTeacherRecordings(
    studentUserId: string,
    filters?: { year?: number; month?: number; day?: number },
  ) {
    const baseWhere: Prisma.MessageWhereInput = {
      senderId: studentUserId,
      type: MessageType.VOICE,
      fileUrl: { not: null },
    };

    if (filters?.year != null && !Number.isNaN(filters.year)) {
      const y = filters.year;
      if (filters.month != null && !Number.isNaN(filters.month) && filters.day != null && !Number.isNaN(filters.day)) {
        const start = new Date(Date.UTC(y, filters.month - 1, filters.day, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y, filters.month - 1, filters.day + 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      } else if (filters.month != null && !Number.isNaN(filters.month)) {
        const start = new Date(Date.UTC(y, filters.month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y, filters.month, 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      } else {
        const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId: { not: studentUserId } },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const voiceToTeacherOnly = messages.filter((m) => {
      const meta = m.metadata as Record<string, unknown> | null;
      return meta && meta.voiceToTeacher === true;
    });

    return voiceToTeacherOnly.map((m) => {
      const teacherParticipant = m.chat.participants[0];
      return {
        id: m.id,
        fileUrl: m.fileUrl,
        fileName: m.fileName ?? undefined,
        duration: m.duration ?? 0,
        createdAt: m.createdAt,
        teacher: teacherParticipant?.user
          ? {
              id: teacherParticipant.user.id,
              firstName: teacherParticipant.user.firstName,
              lastName: teacherParticipant.user.lastName,
            }
          : null,
      };
    });
  }
}

