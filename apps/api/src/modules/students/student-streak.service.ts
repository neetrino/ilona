import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StudentStreakSummary {
  currentStreak: number;
  lastAttendanceDate: Date | null;
  updatedAt: Date;
}

/**
 * Tracks a student's consecutive-present streak across completed lessons.
 * A "streak" counts the number of most-recent completed lessons where the
 * student was marked present, uninterrupted by absence or unmarked entries.
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

    let currentStreak = 0;
    let lastAttendanceDate: Date | null = null;
    for (const entry of attendances) {
      if (!entry.isPresent) {
        break;
      }
      currentStreak += 1;
      if (!lastAttendanceDate && entry.lesson?.scheduledAt) {
        lastAttendanceDate = entry.lesson.scheduledAt;
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
