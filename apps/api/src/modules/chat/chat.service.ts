import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ChatType, MessageType, UserRole } from '@prisma/client';
import { CreateChatDto, SendMessageDto, UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string) {
    try {
      // Ensure connection is active before query
      await this.prisma.ensureConnected();
      
      const chats = await this.prisma.chat.findMany({
        where: {
          participants: {
            some: {
              userId,
              leftAt: null,
            },
          },
          isActive: true,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          participants: {
            where: { leftAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            where: {
              // Filter out soft-deleted messages (content === null && isSystem === true)
              NOT: {
                AND: [
                  { content: null },
                  { isSystem: true },
                ],
              },
            },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // If no chats, return early
      if (chats.length === 0) {
        return [];
      }

      // Batch get unread counts for all chats at once
      const chatIds = chats.map(chat => chat.id);
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          chatId: { in: chatIds },
          userId,
          leftAt: null,
        },
        select: {
          chatId: true,
          lastReadAt: true,
        },
      });

      const participantMap = new Map(
        participants.map(p => [p.chatId, p.lastReadAt])
      );

      // Batch count unread messages for all chats (only for chats with lastReadAt)
      const chatsNeedingCount = chats.filter(chat => {
        const lastReadAt = participantMap.get(chat.id);
        return lastReadAt !== undefined && lastReadAt !== null;
      });

      const unreadCounts = await Promise.all(
        chatsNeedingCount.map(async (chat) => {
          try {
            const lastReadAt = participantMap.get(chat.id)!;
            const count = await this.prisma.message.count({
              where: {
                chatId: chat.id,
                createdAt: { gt: lastReadAt },
                senderId: { not: userId },
              },
            });

            return { chatId: chat.id, count };
          } catch (error) {
            this.logger.warn(`Failed to get unread count for chat ${chat.id}:`, error);
            return { chatId: chat.id, count: 0 };
          }
        })
      );

      const unreadCountMap = new Map(
        unreadCounts.map(uc => [uc.chatId, uc.count])
      );

      // Map results with unread counts
      return chats.map(chat => {
        const lastReadAt = participantMap.get(chat.id);
        // If no lastReadAt, all messages are unread
        const unreadCount = lastReadAt === undefined || lastReadAt === null
          ? chat._count.messages
          : (unreadCountMap.get(chat.id) ?? 0);

        return {
          ...chat,
          unreadCount,
          lastMessage: chat.messages[0] || null,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get user chats for user ${userId}:`, error);
      // Re-throw to let PrismaService middleware handle retry
      throw error;
    }
  }

  /**
   * Get chat by ID with messages
   */
  async getChatById(
    chatId: string,
    userId: string,
    userRole?: string,
  ): Promise<{
    id: string;
    type: ChatType;
    name: string | null;
    groupId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      level: string | null;
      center: {
        id: string;
        name: string;
      } | null;
    } | null;
    participants: Array<{
      id: string;
      chatId: string;
      userId: string;
      isAdmin: boolean;
      joinedAt: Date;
      leftAt: Date | null;
      lastReadAt: Date | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: string;
        status: string | null;
      };
    }>;
  }> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(p => p.userId === userId);
    
    // Allow admin to access group chats even if not a participant
    const isAdminAccessingGroup = (userRole === UserRole.ADMIN || userRole === 'ADMIN') && chat.type === ChatType.GROUP;
    
    // For teachers, validate assignment for group chats
    if (!isParticipant && !isAdminAccessingGroup) {
      if ((userRole === UserRole.TEACHER || userRole === 'TEACHER') && chat.type === ChatType.GROUP && chat.groupId) {
        // Use centralized authorization check
        const accessCheck = await this.canTeacherAccessGroupChat(userId, chat.groupId);
        
        if (accessCheck.hasAccess) {
          // Teacher has access, ensure they're added as participant
          await this.ensureTeacherInGroupChat(chat.id, userId);
          
          // Refetch chat with updated participants
          return this.getChatById(chatId, userId, userRole);
        } else {
          // Dev-only logging for 403 debugging
          if (process.env.NODE_ENV !== 'production') {
            this.logger.warn(
              `[403] Teacher denied access to group chat (getChatById). ` +
              `userId: ${userId}, chatId: ${chatId}, groupId: ${chat.groupId}, ` +
              `teacherId: ${accessCheck.debug?.teacherId || 'N/A'}, ` +
              `groupTeacherId: ${accessCheck.debug?.groupTeacherId || 'N/A'}, ` +
              `hasLessons: ${accessCheck.debug?.hasLessons || false}`
            );
          }
          throw new ForbiddenException('You are not assigned to this group');
        }
      }
      
      // For direct chats, validate teacher-student assignment
      if ((userRole === UserRole.TEACHER || userRole === 'TEACHER') && chat.type === ChatType.DIRECT) {
        const otherParticipant = chat.participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          const otherUser = await this.prisma.user.findUnique({
            where: { id: otherParticipant.userId },
            select: { role: true },
          });
          
          if (otherUser?.role === 'STUDENT') {
            const canAccess = await this.validateStudentTeacherDM(otherParticipant.userId, userId);
            if (canAccess) {
              // Teacher is assigned, ensure they're a participant
              if (!isParticipant) {
                await this.prisma.chatParticipant.upsert({
                  where: {
                    chatId_userId: {
                      chatId: chat.id,
                      userId,
                    },
                  },
                  update: {
                    leftAt: null,
                  },
                  create: {
                    chatId: chat.id,
                    userId,
                    isAdmin: false,
                  },
                });
                
                // Refetch chat with updated participants
                return this.getChatById(chatId, userId, userRole);
              }
              // Already a participant, allow access
              return chat;
            }
          }
        }
      }
      
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // If admin is accessing a group chat and not a participant, add them
    if (isAdminAccessingGroup && !isParticipant) {
      await this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId: chat.id,
            userId,
          },
        },
        update: {
          leftAt: null, // Rejoin if they left
        },
        create: {
          chatId: chat.id,
          userId,
          isAdmin: true,
        },
      });

      // Refetch chat with updated participants
      return this.getChatById(chatId, userId, userRole);
    }

    return chat;
  }

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
    await this.getChatById(chatId, userId, userRole);

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
   * Centralized authorization check: Can a teacher access a group chat?
   * 
   * A teacher can access a group chat if:
   * 1. They are the assigned group teacher (Group.teacherId === Teacher.id), OR
   * 2. They have lessons scheduled in that group (Lesson.teacherId === Teacher.id)
   * 
   * This is the canonical source of truth for teacher->group chat access.
   * 
   * @param teacherUserId - The User.id of the teacher
   * @param groupId - The Group.id to check access for
   * @returns Object with access boolean and debug context (for dev logging)
   */
  private async canTeacherAccessGroupChat(
    teacherUserId: string,
    groupId: string,
  ): Promise<{ hasAccess: boolean; debug?: { teacherId?: string; groupTeacherId?: string | null; hasLessons: boolean } }> {
    // Get teacher entity
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      return { hasAccess: false, debug: { teacherId: undefined, groupTeacherId: undefined, hasLessons: false } };
    }

    // Get group with teacher assignment
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { teacherId: true },
    });

    if (!group) {
      return { hasAccess: false, debug: { teacherId: teacher.id, groupTeacherId: undefined, hasLessons: false } };
    }

    // Check 1: Direct group assignment (Group.teacherId === Teacher.id)
    const isGroupTeacher = group.teacherId === teacher.id;

    // Check 2: Has lessons in this group (Lesson.teacherId === Teacher.id)
    const lessonCount = await this.prisma.lesson.count({
      where: {
        groupId,
        teacherId: teacher.id,
      },
    });

    const hasLessons = lessonCount > 0;

    // Teacher has access if they're the group teacher OR have lessons in the group
    const hasAccess = isGroupTeacher || hasLessons;

    return {
      hasAccess,
      debug: {
        teacherId: teacher.id,
        groupTeacherId: group.teacherId,
        hasLessons,
      },
    };
  }

  /**
   * Ensure teacher is added as ChatParticipant for a group chat if they're assigned
   */
  private async ensureTeacherInGroupChat(chatId: string, teacherUserId: string): Promise<void> {
    // Check if teacher is already a participant
    const existingParticipant = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: teacherUserId,
        },
      },
    });

    if (existingParticipant && !existingParticipant.leftAt) {
      // Already a participant, just ensure isAdmin is true
      if (!existingParticipant.isAdmin) {
        await this.prisma.chatParticipant.update({
          where: {
            chatId_userId: {
              chatId,
              userId: teacherUserId,
            },
          },
          data: { isAdmin: true },
        });
      }
      return;
    }

    // Add or rejoin teacher as admin
    await this.prisma.chatParticipant.upsert({
      where: {
        chatId_userId: {
          chatId,
          userId: teacherUserId,
        },
      },
      update: {
        leftAt: null,
        isAdmin: true,
      },
      create: {
        chatId,
        userId: teacherUserId,
        isAdmin: true,
      },
    });
  }

  /**
   * Validate if a student can DM a teacher
   */
  private async validateStudentTeacherDM(studentUserId: string, teacherUserId: string): Promise<boolean> {
    // Get student profile
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      select: { id: true, teacherId: true, groupId: true },
    });

    if (!student) {
      return false;
    }

    // Get teacher profile
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      return false;
    }

    // Check direct assignment
    if (student.teacherId === teacher.id) {
      return true;
    }

    // Check group assignment
    if (student.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: student.groupId },
        select: { teacherId: true },
      });

      if (group?.teacherId === teacher.id) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a new direct chat
   */
  async createDirectChat(dto: CreateChatDto, creatorId: string) {
    if (!dto.participantIds?.length) {
      throw new BadRequestException('At least one participant is required');
    }

    // Get creator's role
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true },
    });

    if (!creator) {
      throw new NotFoundException('User not found');
    }

    // For direct chats with one participant, validate relationships
    if (dto.participantIds.length === 1) {
      const participantId = dto.participantIds[0];
      const participant = await this.prisma.user.findUnique({
        where: { id: participantId },
        select: { role: true },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      // Allow Admin ↔ Teacher and Admin ↔ Student direct messaging (no validation needed)
      const isAdminInvolved = creator.role === UserRole.ADMIN || participant.role === UserRole.ADMIN;
      
      if (!isAdminInvolved) {
        // If student is trying to DM a teacher, validate assignment
        if (creator.role === UserRole.STUDENT && participant.role === UserRole.TEACHER) {
          const canDM = await this.validateStudentTeacherDM(creatorId, participantId);
          if (!canDM) {
            throw new ForbiddenException('You can only message teachers assigned to you');
          }
        }

        // If teacher is trying to DM a student, validate assignment (reverse check)
        if (creator.role === UserRole.TEACHER && participant.role === UserRole.STUDENT) {
          const canDM = await this.validateStudentTeacherDM(participantId, creatorId);
          if (!canDM) {
            throw new ForbiddenException('You can only message students assigned to you');
          }
        }
      }
    }

    // Check if direct chat already exists between these users
    // For 1:1 chats, find a DIRECT chat that has exactly these two participants
    if (dto.participantIds.length === 1) {
      const participantId = dto.participantIds[0];
      const userIds = [creatorId, participantId].sort(); // Sort for consistent lookup
      
      // Find all direct chats where creator is a participant
      const chatsWithCreator = await this.prisma.chat.findMany({
        where: {
          type: ChatType.DIRECT,
          participants: {
            some: {
              userId: creatorId,
              leftAt: null,
            },
          },
        },
        include: {
          participants: {
            where: { leftAt: null },
            select: {
              userId: true,
            },
          },
        },
      });

      // Check if any of these chats has exactly these two participants
      const existingChat = chatsWithCreator.find((chat) => {
        const participantUserIds = chat.participants.map(p => p.userId).sort();
        return participantUserIds.length === 2 &&
               participantUserIds[0] === userIds[0] &&
               participantUserIds[1] === userIds[1];
      });

      if (existingChat) {
        // Return the full chat with all relations
        const fullChat = await this.prisma.chat.findUnique({
          where: { id: existingChat.id },
          include: {
            participants: {
              where: { leftAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
        
        if (!fullChat) {
          // This shouldn't happen, but handle it gracefully
          throw new NotFoundException('Chat not found');
        }
        
        return fullChat;
      }
    }

    // Create new chat
    const allParticipants = [...new Set([creatorId, ...dto.participantIds])];

    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        name: dto.name,
        participants: {
          create: allParticipants.map((userId, index) => ({
            userId,
            isAdmin: index === 0, // Creator is admin
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return chat;
  }

  /**
   * Send a message
   */
  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string) {
    // Verify user is participant (or admin for group chats)
    const chat = await this.getChatById(dto.chatId, senderId, senderRole);

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
              const canDM = await this.validateStudentTeacherDM(senderId, otherParticipant.userId);
              if (!canDM) {
                throw new ForbiddenException('You can only message teachers assigned to you');
              }
            }

            // If teacher is sending to student, validate assignment
            if (sender.role === UserRole.TEACHER && otherUser?.role === UserRole.STUDENT) {
              const canDM = await this.validateStudentTeacherDM(otherParticipant.userId, senderId);
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
        await this.prisma.lesson.update({
          where: { id: lessonId },
          data: {
            voiceSent: true,
            voiceSentAt: new Date(),
          },
        }).catch(() => {
          // Silently fail if lesson doesn't exist or update fails
        });
      } else if (messageType === MessageType.TEXT && dto.metadata.fromLessonDetail) {
        // Only mark text as sent if it's explicitly from lesson detail page
        await this.prisma.lesson.update({
          where: { id: lessonId },
          data: {
            textSent: true,
            textSentAt: new Date(),
          },
        }).catch(() => {
          // Silently fail if lesson doesn't exist or update fails
        });
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
    const chat = await this.getChatById(chatId, teacherId);
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
   * Get or create a group conversation, ensuring the requesting user has access and membership.
   * This is a helper for voice sending and other flows that need guaranteed access.
   * 
   * @param groupId - The group ID
   * @param userId - The user requesting access
   * @param userRole - The user's role
   * @returns The chat/conversation for the group
   * @throws ForbiddenException if user doesn't have access
   */
  async getOrCreateGroupConversation(
    groupId: string,
    userId: string,
    userRole?: string,
  ) {
    // This delegates to getGroupChat which already handles:
    // - Authorization checks
    // - Chat creation if missing
    // - Membership upsert
    return this.getGroupChat(groupId, userId, userRole);
  }

  /**
   * Get chat for a group
   */
  async getGroupChat(
    groupId: string,
    userId?: string,
    userRole?: string,
  ): Promise<{
    id: string;
    type: ChatType;
    name: string | null;
    groupId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      level: string | null;
      center: {
        id: string;
        name: string;
      } | null;
    } | null;
    participants: Array<{
      id: string;
      chatId: string;
      userId: string;
      isAdmin: boolean;
      joinedAt: Date;
      leftAt: Date | null;
      lastReadAt: Date | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: string;
      };
    }>;
  }> {
    const chat = await this.prisma.chat.findUnique({
      where: { groupId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // If chat doesn't exist, create it lazily (if user is authorized)
    if (!chat) {
      // First, verify the group exists and user has access
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          teacherId: true,
          isActive: true,
        },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      if (!group.isActive) {
        throw new BadRequestException('Group is not active');
      }

      // Check authorization
      let isAuthorized = false;
      if (userRole === UserRole.ADMIN || userRole === 'ADMIN') {
        isAuthorized = true;
      } else if ((userRole === UserRole.TEACHER || userRole === 'TEACHER') && userId) {
        // Use centralized authorization check
        const accessCheck = await this.canTeacherAccessGroupChat(userId, groupId);
        isAuthorized = accessCheck.hasAccess;
        
        // Dev-only logging for 403 debugging
        if (!isAuthorized && process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `[403] Teacher denied access to group chat (chat doesn't exist yet). ` +
            `userId: ${userId}, groupId: ${groupId}, ` +
            `teacherId: ${accessCheck.debug?.teacherId || 'N/A'}, ` +
            `groupTeacherId: ${accessCheck.debug?.groupTeacherId || 'N/A'}, ` +
            `hasLessons: ${accessCheck.debug?.hasLessons || false}`
          );
        }
      } else if (userRole === UserRole.STUDENT && userId) {
        // Check if student is a member of this group
        const student = await this.prisma.student.findFirst({
          where: {
            userId,
            groupId,
          },
          select: { id: true },
        });
        isAuthorized = !!student;
      }

      if (!isAuthorized) {
        throw new ForbiddenException('You are not authorized to access this group chat');
      }

      // Create the chat
      const newChat = await this.prisma.chat.create({
        data: {
          type: ChatType.GROUP,
          name: group.name,
          groupId: group.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            },
          },
          participants: {
            where: { leftAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Add teacher as admin if exists
      if (group.teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: group.teacherId },
          select: { userId: true },
        });

        if (teacher) {
          await this.prisma.chatParticipant.create({
            data: {
              chatId: newChat.id,
              userId: teacher.userId,
              isAdmin: true,
            },
          });
        }
      }

      // Add admin if accessing
      if (userRole === UserRole.ADMIN && userId) {
        await this.prisma.chatParticipant.create({
          data: {
            chatId: newChat.id,
            userId,
            isAdmin: true,
          },
        });
      }

      // Add all students from the group as participants
      const students = await this.prisma.student.findMany({
        where: { groupId },
        select: { userId: true },
      });

      for (const student of students) {
        await this.prisma.chatParticipant.upsert({
          where: {
            chatId_userId: {
              chatId: newChat.id,
              userId: student.userId,
            },
          },
          update: {
            leftAt: null,
            isAdmin: false,
          },
          create: {
            chatId: newChat.id,
            userId: student.userId,
            isAdmin: false,
          },
        });
      }

      // Refetch with all participants
      return this.getGroupChat(groupId, userId, userRole);
    }

    // Check if user is already a participant - if yes, allow access immediately
    if (userId) {
      const isParticipant = chat.participants.some(p => p.userId === userId);
      if (isParticipant) {
        return chat;
      }
    }

    // If admin is accessing and not a participant, add them
    if (userId && userRole === UserRole.ADMIN) {
      await this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId: chat.id,
            userId,
          },
        },
        update: {
          leftAt: null, // Rejoin if they left
        },
        create: {
          chatId: chat.id,
          userId,
          isAdmin: true,
        },
      });

      // Refetch with updated participants
      return this.getGroupChat(groupId, userId, userRole);
    }

    // For teachers, validate assignment to the group
    if (userId && (userRole === UserRole.TEACHER || userRole === 'TEACHER')) {
      // Use centralized authorization check
      const accessCheck = await this.canTeacherAccessGroupChat(userId, groupId);
      
      if (accessCheck.hasAccess) {
        // Teacher has access, ensure they're added as participant
        await this.ensureTeacherInGroupChat(chat.id, userId);
        
        // Refetch with updated participants
        return this.getGroupChat(groupId, userId, userRole);
      } else {
        // Dev-only logging for 403 debugging
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `[403] Teacher denied access to group chat. ` +
            `userId: ${userId}, groupId: ${groupId}, ` +
            `teacherId: ${accessCheck.debug?.teacherId || 'N/A'}, ` +
            `groupTeacherId: ${accessCheck.debug?.groupTeacherId || 'N/A'}, ` +
            `hasLessons: ${accessCheck.debug?.hasLessons || false}`
          );
        }
        throw new ForbiddenException('You are not assigned to this group');
      }
    }

    // For students, validate membership in the group
    if (userId && userRole === UserRole.STUDENT) {
      // Check if student is a member of this group
      const student = await this.prisma.student.findFirst({
        where: {
          userId,
          groupId,
        },
        select: { id: true },
      });
      
      if (student) {
        // Student is a member, add them as participant
        await this.prisma.chatParticipant.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId,
            },
          },
          update: {
            leftAt: null,
            isAdmin: false,
          },
          create: {
            chatId: chat.id,
            userId,
            isAdmin: false,
          },
        });
        
        // Refetch with updated participants
        return this.getGroupChat(groupId, userId, userRole);
      } else {
        throw new ForbiddenException('You are not assigned to this group');
      }
    }

    // If user role is not recognized or userId is missing, deny access
    if (userId) {
      throw new ForbiddenException('You are not authorized to access this group chat');
    }

    return chat;
  }

  /**
   * Get online users in a chat
   */
  getOnlineUsers(_chatId: string, onlineUserIds: Set<string>): string[] {
    return Array.from(onlineUserIds);
  }

  /**
   * Get students list for admin chat
   */
  async getAdminStudents(_adminId: string, search?: string) {
    const where: Prisma.StudentWhereInput = {
      user: {
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    };

    const students = await this.prisma.student.findMany({
      where,
      take: 100, // Limit to 100 for performance
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return students.map((student) => ({
      id: student.user.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      phone: student.user.phone,
      avatarUrl: student.user.avatarUrl,
    }));
  }

  /**
   * Get teachers list for admin chat
   */
  async getAdminTeachers(_adminId: string, search?: string) {
    const where: Prisma.TeacherWhereInput = {
      user: {
        role: 'TEACHER',
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    };

    const teachers = await this.prisma.teacher.findMany({
      where,
      take: 100, // Limit to 100 for performance
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.user.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      phone: teacher.user.phone,
      avatarUrl: teacher.user.avatarUrl,
    }));
  }

  /**
   * Get groups list for admin chat
   */
  async getAdminGroups(_adminId: string, search?: string) {
    const where: Prisma.GroupWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const groups = await this.prisma.group.findMany({
      where,
      take: 100, // Limit to 100 for performance
      orderBy: {
        name: 'asc',
      },
      include: {
        center: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      center: group.center ? { id: group.center.id, name: group.center.name } : null,
    }));
  }

  /**
   * Get teacher's assigned groups
   * Uses the same canonical logic as GroupsService.findByTeacherUserId
   * to ensure consistency across all endpoints
   */
  async getTeacherGroups(teacherUserId: string, search?: string) {
    // Get teacher profile using canonical lookup (same as GroupsService)
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      // Return empty array instead of throwing to match GroupsService behavior
      return [];
    }

    // Use the same WHERE clause logic as GroupsService.findByTeacher
    // This ensures both endpoints return identical groups
    const where: Prisma.GroupWhereInput = {
      teacherId: teacher.id,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const groups = await this.prisma.group.findMany({
      where,
      // No limit - return all assigned groups to match GroupsService.findByTeacher behavior
      orderBy: {
        name: 'asc',
      },
      include: {
        center: {
          select: {
            id: true,
            name: true,
          },
        },
        chat: {
          select: {
            id: true,
            updatedAt: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              where: {
                // Filter out soft-deleted messages (content === null && isSystem === true)
                NOT: {
                  AND: [
                    { content: null },
                    { isSystem: true },
                  ],
                },
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            participants: {
              where: { userId: teacherUserId, leftAt: null },
              select: {
                lastReadAt: true,
              },
            },
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    // Batch get unread counts for all group chats
    const groupsWithChats = groups.filter(g => g.chat);
    
    if (groupsWithChats.length === 0) {
      // No chats, return groups without chat info
      return groups.map((group) => ({
        id: group.id,
        name: group.name,
        level: group.level,
        center: group.center ? { id: group.center.id, name: group.center.name } : null,
        chatId: null,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: group.updatedAt,
      }));
    }

    const chatIds = groupsWithChats.map(g => g.chat!.id);
    
    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        chatId: { in: chatIds },
        userId: teacherUserId,
        leftAt: null,
      },
      select: {
        chatId: true,
        lastReadAt: true,
      },
    });

    const participantMap = new Map(
      participants.map(p => [p.chatId, p.lastReadAt])
    );

    // Only count unread for chats with lastReadAt
    const chatsNeedingCount = groupsWithChats.filter(group => {
      const lastReadAt = participantMap.get(group.chat!.id);
      return lastReadAt !== undefined && lastReadAt !== null;
    });

    // Batch count unread messages for all chats
    const unreadCounts = await Promise.all(
      chatsNeedingCount.map(async (group) => {
        try {
          const chat = group.chat!;
          const lastReadAt = participantMap.get(chat.id)!;
          const count = await this.prisma.message.count({
            where: {
              chatId: chat.id,
              createdAt: { gt: lastReadAt },
              senderId: { not: teacherUserId },
            },
          });

          return { chatId: chat.id, count };
        } catch (error) {
          this.logger.warn(`Failed to get unread count for group ${group.id}:`, error);
          return { chatId: group.chat!.id, count: 0 };
        }
      })
    );

    const unreadCountMap = new Map(
      unreadCounts.map(uc => [uc.chatId, uc.count])
    );

    // Map results with unread counts
    const groupsWithUnread = groups.map((group) => {
      if (!group.chat) {
        return {
          id: group.id,
          name: group.name,
          level: group.level,
          center: group.center ? { id: group.center.id, name: group.center.name } : null,
          chatId: null,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: group.updatedAt,
        };
      }

      const lastReadAt = participantMap.get(group.chat.id);
      // If no lastReadAt, all messages are unread
      const unreadCount = lastReadAt === undefined || lastReadAt === null
        ? group.chat._count.messages
        : (unreadCountMap.get(group.chat.id) ?? 0);

      return {
        id: group.id,
        name: group.name,
        level: group.level,
        center: group.center ? { id: group.center.id, name: group.center.name } : null,
        chatId: group.chat.id,
        lastMessage: group.chat.messages[0] || null,
        unreadCount,
        updatedAt: group.chat.updatedAt,
      };
    });

    return groupsWithUnread;
  }

  /**
   * Get teacher's assigned students
   */
  async getTeacherStudents(teacherUserId: string, search?: string) {
    // Get teacher profile
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const where: Prisma.StudentWhereInput = {
      teacherId: teacher.id,
      user: {
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    };

    const students = await this.prisma.student.findMany({
      where,
      take: 100, // Limit to 100 for performance
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    // Batch find all existing direct chats between teacher and students
    const studentUserIds = students.map(s => s.userId);
    
    // Find all direct chats where teacher is a participant
    const allDirectChats = await this.prisma.chat.findMany({
      where: {
        type: ChatType.DIRECT,
        participants: {
          some: {
            userId: teacherUserId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          select: {
            userId: true,
            lastReadAt: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: {
            // Filter out soft-deleted messages (content === null && isSystem === true)
            NOT: {
              AND: [
                { content: null },
                { isSystem: true },
              ],
            },
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Map chats by student userId (the other participant)
    const chatMap = new Map<string, typeof allDirectChats[0]>();
    for (const chat of allDirectChats) {
      const studentParticipant = chat.participants.find(p => p.userId !== teacherUserId);
      if (studentParticipant && studentUserIds.includes(studentParticipant.userId)) {
        chatMap.set(studentParticipant.userId, chat);
      }
    }

    // Batch get unread counts for all chats
    const chatIds = Array.from(chatMap.values()).map(c => c.id);
    
    if (chatIds.length === 0) {
      // No chats exist, return students without chat info
      return students.map((student) => ({
        id: student.user.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        avatarUrl: student.user.avatarUrl,
        chatId: null,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: student.updatedAt,
      }));
    }

    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        chatId: { in: chatIds },
        userId: teacherUserId,
        leftAt: null,
      },
      select: {
        chatId: true,
        lastReadAt: true,
      },
    });

    const participantMap = new Map(
      participants.map(p => [p.chatId, p.lastReadAt])
    );

    // Create a reverse map from chatId to studentUserId for easier lookup
    const chatToStudentMap = new Map<string, string>();
    for (const [studentUserId, chat] of chatMap.entries()) {
      chatToStudentMap.set(chat.id, studentUserId);
    }

    // Only count unread for chats with lastReadAt
    const chatsNeedingCount = chatIds.filter(chatId => {
      const lastReadAt = participantMap.get(chatId);
      return lastReadAt !== undefined && lastReadAt !== null;
    });

    // Batch count unread messages for all chats
    const unreadCounts = await Promise.all(
      chatsNeedingCount.map(async (chatId) => {
        try {
          const lastReadAt = participantMap.get(chatId)!;
          const count = await this.prisma.message.count({
            where: {
              chatId,
              createdAt: { gt: lastReadAt },
              senderId: { not: teacherUserId },
            },
          });

          return { chatId, count };
        } catch (error) {
          this.logger.warn(`Failed to get unread count for chat ${chatId}:`, error);
          return { chatId, count: 0 };
        }
      })
    );

    const unreadCountMap = new Map(
      unreadCounts.map(uc => [uc.chatId, uc.count])
    );

    // Map students with their chats
    const studentsWithChat = students.map((student) => {
      const existingChat = chatMap.get(student.userId);

      if (!existingChat) {
        return {
          id: student.user.id,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          avatarUrl: student.user.avatarUrl,
          chatId: null,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: student.updatedAt,
        };
      }

      const lastReadAt = participantMap.get(existingChat.id);
      // If no lastReadAt, all messages are unread
      const unreadCount = lastReadAt === undefined || lastReadAt === null
        ? existingChat._count.messages
        : (unreadCountMap.get(existingChat.id) ?? 0);

      return {
        id: student.user.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        avatarUrl: student.user.avatarUrl,
        chatId: existingChat.id,
        lastMessage: existingChat.messages[0] || null,
        unreadCount,
        updatedAt: existingChat.updatedAt,
      };
    });

    return studentsWithChat;
  }

  /**
   * Get admin user info for Teacher Chat
   * Returns the first active admin user (or null if none exists)
   * Also includes existing direct chat info if one exists
   */
  async getAdminForTeacher(teacherUserId: string) {
    // Find the first active admin user
    const adminUser = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      orderBy: {
        createdAt: 'asc', // Get the first admin (primary admin)
      },
    });

    if (!adminUser) {
      return null;
    }

    // Check if a direct chat already exists between teacher and admin
    const userIds = [teacherUserId, adminUser.id].sort();
    
    const chatsWithTeacher = await this.prisma.chat.findMany({
      where: {
        type: ChatType.DIRECT,
        participants: {
          some: {
            userId: teacherUserId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          select: {
            userId: true,
            lastReadAt: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: {
            NOT: {
              AND: [
                { content: null },
                { isSystem: true },
              ],
            },
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Find the chat with exactly these two participants
    const existingChat = chatsWithTeacher.find((chat) => {
      const participantUserIds = chat.participants.map(p => p.userId).sort();
      return participantUserIds.length === 2 &&
             participantUserIds[0] === userIds[0] &&
             participantUserIds[1] === userIds[1];
    });

    // Get unread count if chat exists
    let unreadCount = 0;
    if (existingChat) {
      const teacherParticipant = existingChat.participants.find(p => p.userId === teacherUserId);
      const lastReadAt = teacherParticipant?.lastReadAt;
      
      if (lastReadAt) {
        unreadCount = await this.prisma.message.count({
          where: {
            chatId: existingChat.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: teacherUserId },
          },
        });
      } else {
        // If no lastReadAt, all messages are unread
        unreadCount = existingChat._count.messages;
      }
    }

    return {
      id: adminUser.id,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      avatarUrl: adminUser.avatarUrl,
      chatId: existingChat?.id || null,
      lastMessage: existingChat?.messages[0] || null,
      unreadCount,
      updatedAt: existingChat?.updatedAt || null,
    };
  }

  /**
   * Get admin user info for Student Chat
   * Returns the first active admin user (or null if none exists)
   * Also includes existing direct chat info if one exists
   */
  async getAdminForStudent(studentUserId: string) {
    // Find the first active admin user
    const adminUser = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      orderBy: {
        createdAt: 'asc', // Get the first admin (primary admin)
      },
    });

    if (!adminUser) {
      return null;
    }

    // Check if a direct chat already exists between student and admin
    const userIds = [studentUserId, adminUser.id].sort();
    
    const chatsWithStudent = await this.prisma.chat.findMany({
      where: {
        type: ChatType.DIRECT,
        participants: {
          some: {
            userId: studentUserId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          select: {
            userId: true,
            lastReadAt: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: {
            NOT: {
              AND: [
                { content: null },
                { isSystem: true },
              ],
            },
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Find the chat with exactly these two participants
    const existingChat = chatsWithStudent.find((chat) => {
      const participantUserIds = chat.participants.map(p => p.userId).sort();
      return participantUserIds.length === 2 &&
             participantUserIds[0] === userIds[0] &&
             participantUserIds[1] === userIds[1];
    });

    // Get unread count if chat exists
    let unreadCount = 0;
    if (existingChat) {
      const studentParticipant = existingChat.participants.find(p => p.userId === studentUserId);
      const lastReadAt = studentParticipant?.lastReadAt;
      
      if (lastReadAt) {
        unreadCount = await this.prisma.message.count({
          where: {
            chatId: existingChat.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: studentUserId },
          },
        });
      } else {
        // If no lastReadAt, all messages are unread
        unreadCount = existingChat._count.messages;
      }
    }

    return {
      id: adminUser.id,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      avatarUrl: adminUser.avatarUrl,
      chatId: existingChat?.id || null,
      lastMessage: existingChat?.messages[0] || null,
      unreadCount,
      updatedAt: existingChat?.updatedAt || null,
    };
  }
}