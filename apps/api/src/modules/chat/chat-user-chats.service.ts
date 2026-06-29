import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { getChatDb } from './chat-management.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class ChatUserChatsService {
  private readonly logger = new Logger(ChatUserChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async getUserChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    const db = getChatDb(this.prisma);

    try {
      await this.prisma.ensureConnected();

      const chats = await db.chat.findMany({
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
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (chats.length === 0) {
        return [];
      }

      const chatIds = chats.map((chat) => chat.id);
      const participants = await db.chatParticipant.findMany({
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

      const participantMap = new Map(participants.map((p) => [p.chatId, p.lastReadAt]));

      const chatsNeedingCount = chats.filter((chat) => {
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
        }),
      );

      const unreadCountMap = new Map(unreadCounts.map((uc) => [uc.chatId, uc.count]));

      const chatsWithMetadata = chats.map((chat) => {
        const lastReadAt = participantMap.get(chat.id);
        const unreadCount =
          lastReadAt === undefined || lastReadAt === null
            ? chat._count.messages
            : (unreadCountMap.get(chat.id) ?? 0);

        const lastMessage = chat.messages[0] || null;
        const lastMessageAt = lastMessage?.createdAt || chat.updatedAt;

        return {
          ...chat,
          unreadCount,
          lastMessage,
          lastMessageAt,
        };
      });

      const sorted = chatsWithMetadata.sort((a, b) => {
        return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
      });

      const managerCenterId = this.managerScope.managerCenterIdFromJwt(authUser);
      if (managerCenterId && authUser?.role === UserRole.MANAGER) {
        const scoped: typeof sorted = [];
        for (const c of sorted) {
          const ok = await this.managerScope.isChatInManagerBranch(
            {
              id: c.id,
              type: c.type,
              groupId: c.groupId,
              group: c.group
                ? { center: c.group.center ? { id: c.group.center.id } : null }
                : null,
              participants: c.participants.map((p: { userId: string }) => ({ userId: p.userId })),
            },
            userId,
            managerCenterId,
          );
          if (ok) {
            scoped.push(c);
          }
        }
        return scoped;
      }

      return sorted;
    } catch (error) {
      this.logger.error(`Failed to get user chats for user ${userId}:`, error);
      throw error;
    }
  }
}
