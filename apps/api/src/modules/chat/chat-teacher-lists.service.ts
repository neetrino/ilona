import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ChatType } from '@ilona/database';
import { softDeletedMessageFilter } from './chat-list.util';
import { ChatUnreadCountService } from './chat-unread-count.service';

@Injectable()
export class ChatTeacherListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unreadCountService: ChatUnreadCountService,
  ) {}

  async getTeacherGroups(teacherUserId: string, search?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) return [];

    const searchFilter: Prisma.GroupWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const where: Prisma.GroupWhereInput = {
      isActive: true,
      AND: [
        {
          OR: [
            { teacherId: teacher.id },
            { secondTeacherId: teacher.id },
            { lessons: { some: { substituteTeacherId: teacher.id } } },
          ],
        },
        ...(searchFilter ? [searchFilter] : []),
      ],
    };

    const groups = await this.prisma.group.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        center: { select: { id: true, name: true } },
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
              where: { userId: teacherUserId, leftAt: null },
              select: { lastReadAt: true },
            },
            _count: { select: { messages: true } },
          },
        },
      },
    });

    const groupsWithChats = groups.filter((g) => g.chat);

    if (groupsWithChats.length === 0) {
      return groups.map((group) => this.mapGroupWithoutChat(group));
    }

    const chatIds = groupsWithChats.map((g) => g.chat!.id);
    const participantMap = await this.unreadCountService.getParticipantLastReadMap(
      chatIds,
      teacherUserId,
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
      teacherUserId,
      'group',
    );

    const chatsNeverRead = groupsWithChats.filter((group) => {
      const lastReadAt = participantMap.get(group.chat!.id);
      return lastReadAt === undefined || lastReadAt === null;
    });

    const neverReadCountMap = await this.unreadCountService.countUnreadNeverReadForGroups(
      chatsNeverRead.map((g) => g.chat!.id),
      teacherUserId,
    );

    return groups.map((group) => {
      if (!group.chat) return this.mapGroupWithoutChat(group);

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
        level: group.level,
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

  async getTeacherStudents(teacherUserId: string, search?: string) {
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
      take: 100,
      orderBy: { user: { firstName: 'asc' } },
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

    const studentUserIds = students.map((s) => s.userId);

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
          select: { userId: true, lastReadAt: true },
        },
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
        _count: { select: { messages: true } },
      },
    });

    const chatMap = new Map<string, (typeof allDirectChats)[0]>();
    for (const chat of allDirectChats) {
      const studentParticipant = chat.participants.find((p) => p.userId !== teacherUserId);
      if (studentParticipant && studentUserIds.includes(studentParticipant.userId)) {
        chatMap.set(studentParticipant.userId, chat);
      }
    }

    const chatIds = Array.from(chatMap.values()).map((c) => c.id);

    if (chatIds.length === 0) {
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

    const participantMap = await this.unreadCountService.getParticipantLastReadMap(
      chatIds,
      teacherUserId,
    );

    const chatsNeedingCount = chatIds
      .filter((chatId) => {
        const lastReadAt = participantMap.get(chatId);
        return lastReadAt !== undefined && lastReadAt !== null;
      })
      .map((chatId) => ({
        chatId,
        lastReadAt: participantMap.get(chatId)!,
      }));

    const unreadCountMap = await this.unreadCountService.countUnreadAfterLastRead(
      chatsNeedingCount,
      teacherUserId,
      'chat',
    );

    return students.map((student) => {
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
      const unreadCount =
        lastReadAt === undefined || lastReadAt === null
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
  }

  private mapGroupWithoutChat(group: {
    id: string;
    name: string;
    iconKey: string | null;
    level: string | null;
    updatedAt: Date;
    center: { id: string; name: string } | null;
  }) {
    return {
      id: group.id,
      name: group.name,
      iconKey: group.iconKey,
      level: group.level,
      center: group.center ? { id: group.center.id, name: group.center.name } : null,
      chatId: null,
      lastMessage: null,
      unreadCount: 0,
      messageCount: 0,
      updatedAt: group.updatedAt,
    };
  }
}
