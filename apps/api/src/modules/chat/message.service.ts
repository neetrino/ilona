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
import { Prisma, MessageType, ChatType, UserRole } from '@prisma/client';
import { SendMessageDto, UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { SalariesService } from '../finance/salaries.service';
import { ChatManagementService } from './chat-management.service';
import { ChatAuthorizationService } from './chat-authorization.service';

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
   * Send a message
   */
  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string) {
    // Verify user is participant (or admin for group chats)
    const chat = await this.chatManagementService.getChatById(dto.chatId, senderId, senderRole);

    // Additional permission check for direct chats: validate student-teacher relationship
    // Admin ↔ Teacher and Admin ↔ Student messaging is always allowed
    if (chat.type === ChatType.DIRECT) {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { role: true },
      });

      if (sender) {
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
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId,
        type: dto.type || MessageType.TEXT,
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
    // Include conversationId (chatId) and groupId for navigation
    const response: any = message;
    if (chat.groupId) {
      response.navigation = {
        conversationId: chat.id,
        groupId: chat.groupId,
        messageId: message.id,
      };
    }

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
          }).catch((error) => {
            // Log error but don't fail the message deletion
            this.logger.error(`Failed to delete file from storage. Key: ${key}, Error: ${error.message}`);
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
    // Verify teacher is participant and is admin
    const chat = await this.chatManagementService.getChatById(chatId, teacherId);
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
}

