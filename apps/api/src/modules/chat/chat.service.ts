import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ChatType, MessageType, UserRole } from '@prisma/client';
import { CreateChatDto, SendMessageDto, UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string) {
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

    // Get unread counts
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const participant = chat.participants.find(p => p.userId === userId);
        const unreadCount = participant?.lastReadAt
          ? await this.prisma.message.count({
              where: {
                chatId: chat.id,
                createdAt: { gt: participant.lastReadAt },
                senderId: { not: userId },
              },
            })
          : chat._count.messages;

        return {
          ...chat,
          unreadCount,
          lastMessage: chat.messages[0] || null,
        };
      }),
    );

    return chatsWithUnread;
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
    const isAdminAccessingGroup = userRole === 'ADMIN' && chat.type === ChatType.GROUP;
    
    if (!isParticipant && !isAdminAccessingGroup) {
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

    // For direct chats with one participant, validate student-teacher relationship
    if (dto.participantIds.length === 1) {
      const participantId = dto.participantIds[0];
      const participant = await this.prisma.user.findUnique({
        where: { id: participantId },
        select: { role: true },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

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

    // Check if direct chat already exists between these users
    if (dto.participantIds.length === 1) {
      const existingChat = await this.prisma.chat.findFirst({
        where: {
          type: ChatType.DIRECT,
          participants: {
            every: {
              userId: { in: [creatorId, dto.participantIds[0]] },
            },
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

      if (existingChat) {
        return existingChat;
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

    return message;
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
        // For local storage: http://localhost:4000/api/storage/file/chat/filename.webm -> chat/filename.webm
        let key: string | undefined;
        
        if (message.fileUrl.includes('.r2.dev')) {
          // R2 URL
          try {
            const url = new URL(message.fileUrl);
            key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
          } catch {
            // If URL parsing fails, try to extract manually
            const match = message.fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
            if (match) {
              key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
            }
          }
        } else if (message.fileUrl.includes('/api/storage/file/')) {
          // Local storage URL
          const parts = message.fileUrl.split('/api/storage/file/');
          if (parts.length > 1) {
            key = decodeURIComponent(parts[1]);
          }
        } else {
          // Try to extract key from any URL format
          const match = message.fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
          if (match) {
            key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
          }
        }

        if (key) {
          await this.storageService.delete(key).catch((error) => {
            // Log error but don't fail the message deletion
            console.error(`Failed to delete file from storage: ${error.message}`);
          });
        }
      } catch (error) {
        // Log error but don't fail the message deletion
        console.error(`Error deleting file: ${error instanceof Error ? error.message : String(error)}`);
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

    if (!chat) {
      throw new NotFoundException('Group chat not found');
    }

    // If admin is accessing and not a participant, add them
    if (userId && userRole === 'ADMIN') {
      const isParticipant = chat.participants.some(p => p.userId === userId);
      if (!isParticipant) {
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
}

