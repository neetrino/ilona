import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationData, NotificationListResponse } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TAKE = 30;
const MAX_TAKE = 50;

@Injectable()
export class NotificationInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    cursor?: string,
    take = DEFAULT_TAKE,
  ): Promise<NotificationListResponse> {
    const limit = Math.min(Math.max(take, 1), MAX_TAKE);
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        data: (row.data ?? null) as NotificationData | null,
        isRead: row.isRead,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
      unreadCount,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }
}
