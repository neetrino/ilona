import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StudentStreakSummary {
  currentStreak: number;
  lastAttendanceDate: Date | null;
  updatedAt: Date;
}

/**
 * Tracks a student's consecutive-present streak across scheduled class days.
 * A "streak" counts recent days where all completed lessons for that day
 * were attended.
 */
@Injectable()
export class StudentStreakService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recomputes the streak from attendance history and persists it.
   * Safe to call after every attendance mutation (create/update).
   */
  async recomputeStreak(studentId: string): Promise<StudentStreakSummary> {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId,
        lesson: { status: 'COMPLETED' },
      },
      include: { lesson: { select: { scheduledAt: true } } },
      orderBy: { lesson: { scheduledAt: 'desc' } },
    });

    const groupedByDay = new Map<string, typeof attendances>();
    for (const entry of attendances) {
      const scheduledAt = entry.lesson?.scheduledAt;
      if (!scheduledAt) continue;
      const dayKey = scheduledAt.toISOString().slice(0, 10);
      const dayRows = groupedByDay.get(dayKey);
      if (dayRows) {
        dayRows.push(entry);
      } else {
        groupedByDay.set(dayKey, [entry]);
      }
    }

    let currentStreak = 0;
    let lastAttendanceDate: Date | null = null;
    for (const dayRows of groupedByDay.values()) {
      const dayIsFullyPresent = dayRows.every((entry) => entry.isPresent);
      if (!dayIsFullyPresent) break;

      currentStreak += 1;
      if (!lastAttendanceDate) {
        lastAttendanceDate = dayRows[0]?.lesson?.scheduledAt ?? null;
      }
    }

    const updated = await this.prisma.studentStreak.upsert({
      where: { studentId },
      create: { studentId, currentStreak, lastAttendanceDate },
      update: { currentStreak, lastAttendanceDate },
      select: { currentStreak: true, lastAttendanceDate: true, updatedAt: true },
    });

    return updated;
  }

  async getStreak(studentId: string): Promise<StudentStreakSummary> {
    const record = await this.prisma.studentStreak.findUnique({
      where: { studentId },
      select: { currentStreak: true, lastAttendanceDate: true, updatedAt: true },
    });
    if (record) {
      return record;
    }
    return this.recomputeStreak(studentId);
  }
}
