import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays } from './analytics.util';

@Injectable()
export class AnalyticsLessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonsOverview(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subDays(new Date(), 30);
    const to = dateTo || new Date();

    const lessons = await this.prisma.lesson.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
      },
    });

    const total = lessons.length;
    const completed = lessons.filter((l) => l.status === 'COMPLETED').length;
    const cancelled = lessons.filter((l) => l.status === 'CANCELLED').length;
    const missed = lessons.filter((l) => l.status === 'MISSED').length;
    const vocabularySent = lessons.filter((l) => l.vocabularySent).length;

    return {
      total,
      completed,
      cancelled,
      missed,
      scheduled: lessons.filter((l) => l.status === 'SCHEDULED').length,
      inProgress: lessons.filter((l) => l.status === 'IN_PROGRESS').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      vocabularySentRate: completed > 0 ? Math.round((vocabularySent / completed) * 100) : 0,
    };
  }
}
