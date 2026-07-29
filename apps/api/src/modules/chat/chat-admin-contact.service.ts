import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatType, UserRole, UserStatus } from '@ilona/database';
import { formatUserFullName, softDeletedMessageFilter } from './chat-list.util';
import { ChatUnreadCountService } from './chat-unread-count.service';
import { ChatDirectService } from './chat-direct.service';

@Injectable()
export class ChatAdminContactService {
  private readonly logger = new Logger(ChatAdminContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unreadCountService: ChatUnreadCountService,
    private readonly directService: ChatDirectService,
  ) {}

  getAdminForTeacher(teacherUserId: string): Promise<unknown> {
    return this.getAdminForPortalUser(teacherUserId);
  }

  getAdminForStudent(studentUserId: string): Promise<unknown> {
    return this.getAdminForPortalUser(studentUserId, { ensureDirectChat: true });
  }

  /**
   * Ensures a DIRECT chat exists between the portal user and the canonical ACTIVE admin.
   * Idempotent — safe to call on registration and when listing chats.
   */
  async ensureAdminDirectChat(portalUserId: string): Promise<string | null> {
    const adminUser = await this.findCanonicalAdmin();
    if (!adminUser) return null;

    try {
      const chat = await this.directService.createDirectChat(
        { participantIds: [adminUser.id] },
        portalUserId,
      );
      return chat.id;
    } catch (error) {
      this.logger.warn(
        `Failed to ensure admin direct chat for user ${portalUserId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Creates admin DIRECT chats for every ACTIVE student who does not already have one.
   * Used to backfill students registered before admin DM provisioning existed.
   */
  async backfillStudentAdminDirectChats(): Promise<{ ensured: number; skipped: number }> {
    const adminUser = await this.findCanonicalAdmin();
    if (!adminUser) {
      return { ensured: 0, skipped: 0 };
    }

    const students = await this.prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });

    let ensured = 0;
    let skipped = 0;

    for (const student of students) {
      const chatId = await this.ensureAdminDirectChat(student.id);
      if (chatId) {
        ensured += 1;
      } else {
        skipped += 1;
      }
    }

    return { ensured, skipped };
  }

  private findCanonicalAdmin() {
    return this.prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async getAdminForPortalUser(
    portalUserId: string,
    options?: { ensureDirectChat?: boolean },
  ): Promise<unknown> {
    const adminUser = await this.findCanonicalAdmin();

    if (!adminUser) return null;

    if (options?.ensureDirectChat) {
      await this.ensureAdminDirectChat(portalUserId);
    }

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
