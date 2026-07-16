import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@ilona/database';
import { formatUserFullName, softDeletedMessageFilter } from './chat-list.util';
import { ChatUnreadCountService } from './chat-unread-count.service';

@Injectable()
export class ChatAdminListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unreadCountService: ChatUnreadCountService,
  ) {}

  async getAdminStudents(_adminId: string, search?: string, branchCenterId?: string) {
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
      ...(branchCenterId
        ? {
            OR: [{ group: { centerId: branchCenterId } }, { centerId: branchCenterId }],
          }
        : {}),
    };

    const students = await this.prisma.student.findMany({
      where,
      take: 100,
      orderBy: { user: { firstName: 'asc' } },
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
      name: formatUserFullName(student.user.firstName, student.user.lastName),
      phone: student.user.phone,
      avatarUrl: student.user.avatarUrl,
    }));
  }

  async getAdminTeachers(_adminId: string, search?: string, branchCenterId?: string) {
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
      ...(branchCenterId
        ? {
            OR: [
              { centerLinks: { some: { centerId: branchCenterId } } },
              { groups: { some: { centerId: branchCenterId } } },
            ],
          }
        : {}),
    };

    const teachers = await this.prisma.teacher.findMany({
      where,
      take: 100,
      orderBy: { user: { firstName: 'asc' } },
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
      name: formatUserFullName(teacher.user.firstName, teacher.user.lastName),
      phone: teacher.user.phone,
      avatarUrl: teacher.user.avatarUrl,
    }));
  }

  async getAdminGroups(adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.GroupWhereInput = {
      isActive: true,
      ...(branchCenterId ? { centerId: branchCenterId } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const groups = await this.prisma.group.findMany({
      where,
      take: 100,
      orderBy: { name: 'asc' },
      include: {
        center: {
          select: { id: true, name: true },
        },
        chat: {
          select: {
            id: true,
            updatedAt: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              where: softDeletedMessageFilter,
              include: {
                sender: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
            participants: {
              where: { userId: adminId, leftAt: null },
              select: { lastReadAt: true },
            },
            _count: { select: { messages: true } },
          },
        },
      },
    });

    // Join admin into class group chats so unread + socket fan-out work without opening each chat.
    // lastReadAt = now on first join avoids flooding badges with full history.
    const chatsMissingAdmin = groups.filter(
      (group) => group.chat && group.chat.participants.length === 0,
    );
    if (chatsMissingAdmin.length > 0) {
      const joinedAt = new Date();
      await Promise.all(
        chatsMissingAdmin.map((group) =>
          this.prisma.chatParticipant.upsert({
            where: {
              chatId_userId: { chatId: group.chat!.id, userId: adminId },
            },
            create: {
              chatId: group.chat!.id,
              userId: adminId,
              isAdmin: true,
              lastReadAt: joinedAt,
            },
            update: { leftAt: null },
          }),
        ),
      );
    }

    const groupsWithChats = groups.filter((g) => g.chat);
    if (groupsWithChats.length === 0) {
      return groups.map((group) => this.mapAdminGroupWithoutChat(group));
    }

    const chatIds = groupsWithChats.map((g) => g.chat!.id);
    const participantMap = await this.unreadCountService.getParticipantLastReadMap(
      chatIds,
      adminId,
    );

    const chatsNeedingCount = groupsWithChats
      .filter((group) => {
        const lastReadAt = participantMap.get(group.chat!.id);
        return lastReadAt !== undefined && lastReadAt !== null;
      })
      .map((group) => ({
        chatId: group.chat!.id,
        lastReadAt: participantMap.get(group.chat!.id)!,
      }));

    const unreadCountMap = await this.unreadCountService.countUnreadAfterLastRead(
      chatsNeedingCount,
      adminId,
      'admin-group',
    );

    const chatsNeverRead = groupsWithChats.filter((group) => {
      const lastReadAt = participantMap.get(group.chat!.id);
      return lastReadAt === undefined || lastReadAt === null;
    });

    const neverReadCountMap = await this.unreadCountService.countUnreadNeverReadForGroups(
      chatsNeverRead.map((g) => g.chat!.id),
      adminId,
    );

    return groups.map((group) => {
      if (!group.chat) return this.mapAdminGroupWithoutChat(group);

      const lastReadAt = participantMap.get(group.chat.id);
      const unreadCount =
        lastReadAt === undefined || lastReadAt === null
          ? (neverReadCountMap.get(group.chat.id) ?? group.chat._count.messages)
          : (unreadCountMap.get(group.chat.id) ?? 0);

      const lastMsg = group.chat.messages[0];
      const lastMessage = lastMsg
        ? {
            id: lastMsg.id,
            type: lastMsg.type,
            content: lastMsg.content,
            fileName: lastMsg.fileName ?? null,
            createdAt:
              lastMsg.createdAt instanceof Date
                ? lastMsg.createdAt.toISOString()
                : lastMsg.createdAt,
            sender: lastMsg.sender
              ? {
                  id: lastMsg.sender.id,
                  firstName: lastMsg.sender.firstName,
                  lastName: lastMsg.sender.lastName,
                }
              : null,
          }
        : null;

      return {
        id: group.id,
        name: group.name,
        iconKey: group.iconKey,
        center: group.center ? { id: group.center.id, name: group.center.name } : null,
        chatId: group.chat.id,
        lastMessage,
        unreadCount,
        messageCount: group.chat._count.messages,
        updatedAt:
          group.chat.updatedAt instanceof Date
            ? group.chat.updatedAt.toISOString()
            : group.chat.updatedAt,
      };
    });
  }

  private mapAdminGroupWithoutChat(group: {
    id: string;
    name: string;
    iconKey: string | null;
    updatedAt: Date;
    center: { id: string; name: string } | null;
  }) {
    return {
      id: group.id,
      name: group.name,
      iconKey: group.iconKey,
      center: group.center ? { id: group.center.id, name: group.center.name } : null,
      chatId: null,
      lastMessage: null,
      unreadCount: 0,
      messageCount: 0,
      updatedAt: group.updatedAt instanceof Date ? group.updatedAt.toISOString() : group.updatedAt,
    };
  }

  async getAdminAllUsers(_adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.UserWhereInput = {
      status: 'ACTIVE',
      ...(branchCenterId
        ? {
            role: { in: [UserRole.STUDENT, UserRole.TEACHER, UserRole.MANAGER] },
            OR: [
              {
                role: UserRole.STUDENT,
                student: {
                  OR: [{ group: { centerId: branchCenterId } }, { centerId: branchCenterId }],
                },
              },
              {
                role: UserRole.TEACHER,
                teacher: {
                  OR: [
                    { centerLinks: { some: { centerId: branchCenterId } } },
                    { groups: { some: { centerId: branchCenterId } } },
                  ],
                },
              },
              {
                role: UserRole.MANAGER,
                managerProfile: {
                  centerId: branchCenterId,
                  isCurrentAssignment: true,
                },
              },
            ],
          }
        : {}),
      ...(search &&
        search.trim() && {
          OR: [
            { firstName: { contains: search.trim(), mode: 'insensitive' } },
            { lastName: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
            { phone: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }),
    };

    const users = await this.prisma.user.findMany({
      where,
      take: 100,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: formatUserFullName(u.firstName, u.lastName),
      email: u.email,
      phone: u.phone ?? undefined,
      avatarUrl: u.avatarUrl ?? undefined,
      role: u.role,
    }));
  }
}
