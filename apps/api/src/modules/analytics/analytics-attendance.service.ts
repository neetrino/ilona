import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays } from './analytics.util';

@Injectable()
export class AnalyticsAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceOverview(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subDays(new Date(), 30);
    const to = dateTo || new Date();

    const attendances = await this.prisma.attendance.findMany({
      where: {
        lesson: {
          scheduledAt: { gte: from, lte: to },
        },
      },
    });

    const total = attendances.length;
    const present = attendances.filter((a) => a.isPresent).length;
    const absentJustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'JUSTIFIED',
    ).length;
    const absentUnjustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'UNJUSTIFIED',
    ).length;

    const dailyStats: Record<string, { present: number; absent: number }> = {};

    for (const att of attendances) {
      const date = new Date(att.markedAt || att.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { present: 0, absent: 0 };
      }
      if (att.isPresent) {
        dailyStats[date].present++;
      } else {
        dailyStats[date].absent++;
      }
    }

    return {
      summary: {
        total,
        present,
        absentJustified,
        absentUnjustified,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      daily: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
