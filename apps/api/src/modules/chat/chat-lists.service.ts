import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ChatType, UserRole } from '@prisma/client';

/**
 * Service responsible for chat-related list operations
 */
@Injectable()
export class ChatListsService {
  private readonly logger = new Logger(ChatListsService.name);

  constructor(private readonly prisma: PrismaService) {}

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




