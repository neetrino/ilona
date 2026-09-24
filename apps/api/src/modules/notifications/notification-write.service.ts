import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@ilona/database';
import type { InboxNotificationType, NotificationData } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';

export type CreateNotificationInput = {
  userIds: string[];
  type: InboxNotificationType | string;
  title: string;
  content: string;
  data?: NotificationData;
  dedupeKey?: string;
};

@Injectable()
export class NotificationWriteService {
  private readonly logger = new Logger(NotificationWriteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createForUsers(input: CreateNotificationInput): Promise<number> {
    const userIds = [...new Set(input.userIds.filter(Boolean))];
    if (userIds.length === 0) {
      return 0;
    }

    let created = 0;
    for (const userId of userIds) {
      const written = await this.createOne(userId, input);
      if (written) {
        created += 1;
      }
    }
    return created;
  }

  private async createOne(userId: string, input: CreateNotificationInput): Promise<boolean> {
    const dedupeKey = input.dedupeKey ? `${input.type}:${userId}:${input.dedupeKey}` : undefined;
    if (dedupeKey && (await this.hasDedupe(userId, input.type, dedupeKey))) {
      return false;
    }

    const data: NotificationData = {
      ...(input.data ?? {}),
      ...(dedupeKey ? { dedupeKey } : {}),
    };

    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: input.type,
          title: input.title,
          content: input.content,
          data: data as Prisma.InputJsonValue,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to create notification for ${userId}`, error);
      return false;
    }
  }

  private async hasDedupe(userId: string, type: string, dedupeKey: string): Promise<boolean> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type,
        data: { path: ['dedupeKey'], equals: dedupeKey },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }
}
