import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatType, UserRole } from '@ilona/database';
import { formatUserFullName, softDeletedMessageFilter } from './chat-list.util';
import { ChatUnreadCountService } from './chat-unread-count.service';

@Injectable()
export class ChatAdminContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unreadCountService: ChatUnreadCountService,
  ) {}

  getAdminForTeacher(teacherUserId: string): Promise<unknown> {
    return this.getAdminForPortalUser(teacherUserId);
  }

  getAdminForStudent(studentUserId: string): Promise<unknown> {
    return this.getAdminForPortalUser(studentUserId);
  }

  private async getAdminForPortalUser(portalUserId: string): Promise<unknown> {
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
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) return null;

    const userIds = [portalUserId, adminUser.id].sort();

    const directChats = await this.prisma.chat.findMany({
      where: {
        type: ChatType.DIRECT,
        participants: {
          some: {
            userId: portalUserId,
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
          where: softDeletedMessageFilter,
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

    const existingChat = directChats.find((chat) => {
      const participantUserIds = chat.participants.map((p) => p.userId).sort();
      return (
        participantUserIds.length === 2 &&
        participantUserIds[0] === userIds[0] &&
        participantUserIds[1] === userIds[1]
      );
    });

    let unreadCount = 0;
    if (existingChat) {
      const portalParticipant = existingChat.participants.find((p) => p.userId === portalUserId);
      unreadCount = await this.unreadCountService.getSingleChatUnreadCount(
        existingChat.id,
        portalUserId,
        portalParticipant?.lastReadAt,
        existingChat._count.messages,
      );
    }

    return {
      id: adminUser.id,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      name: formatUserFullName(adminUser.firstName, adminUser.lastName),
      avatarUrl: adminUser.avatarUrl,
      chatId: existingChat?.id || null,
      lastMessage: existingChat?.messages[0] || null,
      unreadCount,
      updatedAt: existingChat?.updatedAt || null,
    };
  }
}
