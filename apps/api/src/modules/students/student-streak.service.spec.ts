import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { StudentStreakService } from './student-streak.service';

interface MockPrisma {
  attendance: {
    findMany: Mock;
  };
  studentStreak: {
    upsert: Mock;
    findUnique: Mock;
  };
}

function attendanceRow(scheduledAt: string, isPresent: boolean) {
  return {
    isPresent,
    lesson: {
      scheduledAt: new Date(scheduledAt),
    },
  };
}

describe('StudentStreakService', () => {
  let service: StudentStreakService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      attendance: {
        findMany: vi.fn(),
      },
      studentStreak: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    service = new StudentStreakService(prisma as never);
  });

  it('counts one streak day when all lessons on that day are present', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      attendanceRow('2026-04-21T10:00:00.000Z', true),
      attendanceRow('2026-04-21T07:00:00.000Z', true),
      attendanceRow('2026-04-20T10:00:00.000Z', false),
    ]);
    prisma.studentStreak.upsert.mockImplementation(({ create }: { create: { currentStreak: number; lastAttendanceDate: Date | null } }) => ({
      currentStreak: create.currentStreak,
      lastAttendanceDate: create.lastAttendanceDate,
      updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    }));

    const result = await service.recomputeStreak('student-1');

    expect(result.currentStreak).toBe(1);
    expect(result.lastAttendanceDate?.toISOString()).toBe('2026-04-21T10:00:00.000Z');
  });

  it('resets streak when latest day has at least one missed class', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      attendanceRow('2026-04-21T10:00:00.000Z', true),
      attendanceRow('2026-04-21T12:00:00.000Z', false),
      attendanceRow('2026-04-20T08:00:00.000Z', true),
    ]);
    prisma.studentStreak.upsert.mockImplementation(({ create }: { create: { currentStreak: number; lastAttendanceDate: Date | null } }) => ({
      currentStreak: create.currentStreak,
      lastAttendanceDate: create.lastAttendanceDate,
      updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    }));

    const result = await service.recomputeStreak('student-1');

    expect(result.currentStreak).toBe(0);
    expect(result.lastAttendanceDate).toBeNull();
  });

  it('counts consecutive days and stops on first failed day', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      attendanceRow('2026-04-21T09:00:00.000Z', true),
      attendanceRow('2026-04-20T09:00:00.000Z', true),
      attendanceRow('2026-04-19T09:00:00.000Z', false),
      attendanceRow('2026-04-18T09:00:00.000Z', true),
    ]);
    prisma.studentStreak.upsert.mockImplementation(({ create }: { create: { currentStreak: number; lastAttendanceDate: Date | null } }) => ({
      currentStreak: create.currentStreak,
      lastAttendanceDate: create.lastAttendanceDate,
      updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    }));

    const result = await service.recomputeStreak('student-1');

    expect(result.currentStreak).toBe(2);
    expect(result.lastAttendanceDate?.toISOString()).toBe('2026-04-21T09:00:00.000Z');
  });

  it('recomputes when no stored streak exists', async () => {
    prisma.studentStreak.findUnique.mockResolvedValue(null);
    prisma.attendance.findMany.mockResolvedValue([attendanceRow('2026-04-21T09:00:00.000Z', true)]);
    prisma.studentStreak.upsert.mockImplementation(({ create }: { create: { currentStreak: number; lastAttendanceDate: Date | null } }) => ({
      currentStreak: create.currentStreak,
      lastAttendanceDate: create.lastAttendanceDate,
      updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    }));

    const result = await service.getStreak('student-1');

    expect(result.currentStreak).toBe(1);
    expect(prisma.attendance.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.studentStreak.upsert).toHaveBeenCalledTimes(1);
  });
});
