import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatType, UserRole } from '@ilona/database';
import { CreateChatDto, CreateCustomGroupChatDto } from './dto';
import { ChatAuthorizationService } from './chat-authorization.service';

/**
 * Service responsible for chat/conversation management operations
 */
@Injectable()
export class ChatManagementService {
  private readonly logger = new Logger(ChatManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: ChatAuthorizationService,
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
              center: { select: { id: true, name: true } },
              teacherId: true,
              teacher: { select: { userId: true } },
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
        // Initial order by updatedAt (will be re-sorted by lastMessageAt after processing)
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

      // Map results with unread counts and lastMessageAt
      const chatsWithMetadata = chats.map(chat => {
        const lastReadAt = participantMap.get(chat.id);
        // If no lastReadAt, all messages are unread
        const unreadCount = lastReadAt === undefined || lastReadAt === null
          ? chat._count.messages
          : (unreadCountMap.get(chat.id) ?? 0);

        const lastMessage = chat.messages[0] || null;
        // lastMessageAt is the timestamp of the last message, or chat.updatedAt if no messages
        const lastMessageAt = lastMessage?.createdAt || chat.updatedAt;

        return {
          ...chat,
          unreadCount,
          lastMessage,
          lastMessageAt,
        };
      });

      // Sort by lastMessageAt DESC (newest first)
      return chatsWithMetadata.sort((a, b) => {
        const aTime = a.lastMessageAt.getTime();
        const bTime = b.lastMessageAt.getTime();
        return bTime - aTime; // DESC order
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
      teacherId: string | null;
      teacher: { userId: string } | null;
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
            teacherId: true,
            teacher: { select: { userId: true } },
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
        const accessCheck = await this.authorizationService.canTeacherAccessGroupChat(userId, chat.groupId);
        
        if (accessCheck.hasAccess) {
          // Teacher has access, ensure they're added as participant
          await this.authorizationService.ensureTeacherInGroupChat(chat.id, userId);
          
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
            const canAccess = await this.authorizationService.validateStudentTeacherDM(otherParticipant.userId, userId);
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
    // Only for class/teaching group chats (groupId set). Custom group chats are members-only.
    if (isAdminAccessingGroup && !isParticipant && chat.groupId) {
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

    // Custom group chats (groupId=null): members-only, no admin auto-join
    if (chat.type === ChatType.GROUP && !chat.groupId && !isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return chat;
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
          const canDM = await this.authorizationService.validateStudentTeacherDM(creatorId, participantId);
          if (!canDM) {
            throw new ForbiddenException('You can only message teachers assigned to you');
          }
        }

        // If teacher is trying to DM a student, validate assignment (reverse check)
        if (creator.role === UserRole.TEACHER && participant.role === UserRole.STUDENT) {
          const canDM = await this.authorizationService.validateStudentTeacherDM(participantId, creatorId);
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
      teacherId: string | null;
      teacher: { userId: string } | null;
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
            teacherId: true,
            teacher: { select: { userId: true } },
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

    // If chat doesn't exist, create it lazily (Admin only - only Admin can create group chats)
    if (!chat) {
      // First, verify the group exists
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

      // Only Admin can create a new group chat; Teachers/Students get 403
      if (userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
        throw new ForbiddenException('Only administrators can create group chats');
      }

      if (!userId) {
        throw new ForbiddenException('Authentication required');
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

      // Add admin (requesting user) as participant
      if (userId) {
        await this.prisma.chatParticipant.create({
          data: {
            chatId: newChat.id,
            userId,
            isAdmin: true,
          },
        });
      }

      // Add group's teacher as participant if exists
      if (group.teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: group.teacherId },
          select: { userId: true },
        });
        if (teacher) {
          await this.prisma.chatParticipant.upsert({
            where: {
              chatId_userId: {
                chatId: newChat.id,
                userId: teacher.userId,
              },
            },
            update: { leftAt: null },
            create: {
              chatId: newChat.id,
              userId: teacher.userId,
              isAdmin: true,
            },
          });
        }
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
      const accessCheck = await this.authorizationService.canTeacherAccessGroupChat(userId, groupId);
      
      if (accessCheck.hasAccess) {
        // Teacher has access, ensure they're added as participant
        await this.authorizationService.ensureTeacherInGroupChat(chat.id, userId);
        
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
   * Add a member to a group chat. Admin only (enforced by controller).
   * Validates: group exists, chat exists, user exists, user not already a member.
   */
  async addGroupChatMember(
    groupId: string,
    userId: string,
    _adminId: string,
  ): Promise<{ chatId: string; participant: { userId: string; joinedAt: Date } }> {
    const chat = await this.prisma.chat.findUnique({
      where: { groupId },
      select: { id: true },
    });
    if (!chat) {
      throw new NotFoundException('Group chat not found. Open the group chat first.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add inactive or suspended users to the group');
    }

    const existing = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
      select: { leftAt: true },
    });
    if (existing && existing.leftAt === null) {
      throw new BadRequestException('User is already a member of this group');
    }

    const participant = await this.prisma.chatParticipant.upsert({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
      update: { leftAt: null },
      create: {
        chatId: chat.id,
        userId,
        isAdmin: false,
      },
      select: { userId: true, joinedAt: true },
    });

    return {
      chatId: chat.id,
      participant: { userId: participant.userId, joinedAt: participant.joinedAt },
    };
  }

  /**
   * List custom group chats (type=GROUP, groupId=null) the user belongs to.
   */
  async getCustomGroupChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        type: ChatType.GROUP,
        groupId: null,
        isActive: true,
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
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
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: {
            NOT: {
              AND: [{ content: null }, { isSystem: true }],
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
      },
    });
    return chats;
  }

  /**
   * Create a custom (standalone) group chat. Admin only. Not linked to class/teaching groups.
   */
  async createCustomGroupChat(
    adminId: string,
    dto: CreateCustomGroupChatDto,
  ) {
    // Creator is always added as member; ignore if client sent creator in participantIds
    const participantIds = (dto.participantIds ?? []).filter((id) => id !== adminId);
    const allUserIds = [adminId, ...participantIds];
    const uniqueIds = [...new Set(allUserIds)];

    // Validate all users exist and are active
    for (const uid of uniqueIds) {
      const u = await this.prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, status: true },
      });
      if (!u) {
        throw new NotFoundException(`User not found: ${uid}`);
      }
      if (u.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot add inactive or suspended users to the group');
      }
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        name: dto.name.trim(),
        groupId: null, // Standalone, not linked to teaching Group
        participants: {
          create: uniqueIds.map((userId) => ({
            userId,
            isAdmin: userId === adminId,
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
                role: true,
              },
            },
          },
        },
      },
    });

    return chat;
  }

  /**
   * Add a member to a custom group chat (groupId=null). Admin only.
   */
  async addCustomGroupChatMember(
    chatId: string,
    userId: string,
    _adminId: string,
  ): Promise<{ chatId: string; participant: { userId: string; joinedAt: Date } }> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, groupId: true },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.type !== ChatType.GROUP || chat.groupId !== null) {
      throw new BadRequestException('This endpoint is only for custom group chats');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add inactive or suspended users to the group');
    }

    const existing = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
      select: { leftAt: true },
    });
    if (existing && existing.leftAt === null) {
      throw new BadRequestException('User is already a member of this group');
    }

    const participant = await this.prisma.chatParticipant.upsert({
      where: {
        chatId_userId: { chatId, userId },
      },
      update: { leftAt: null },
      create: {
        chatId,
        userId,
        isAdmin: false,
      },
      select: { userId: true, joinedAt: true },
    });

    return {
      chatId,
      participant: { userId: participant.userId, joinedAt: participant.joinedAt },
    };
  }

  /**
   * Get online users in a chat
   */
  getOnlineUsers(_chatId: string, onlineUserIds: Set<string>): string[] {
    return Array.from(onlineUserIds);
  }
}






