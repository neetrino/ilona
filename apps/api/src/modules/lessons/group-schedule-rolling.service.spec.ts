import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { GroupScheduleRollingService } from './group-schedule-rolling.service';

const TEACHER_1 = 'teacher-a';
const TEACHER_2 = 'teacher-b';
const GROUP_ID = 'group-rolling';

describe('GroupScheduleRollingService', () => {
  let service: GroupScheduleRollingService;
  let createMany: Mock;
  let groupUpdate: Mock;
  let findManyGroups: Mock;
  let findManyLessons: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    createMany = vi.fn().mockResolvedValue({ count: 0 });
    groupUpdate = vi.fn().mockResolvedValue({});
    findManyLessons = vi.fn().mockResolvedValue([]);
    findManyGroups = vi.fn().mockResolvedValue([
      {
        id: GROUP_ID,
        teacherId: TEACHER_1,
        secondTeacherId: TEACHER_2,
        secondTeacherStartsFirstWeek: false,
        schedule: {
          weeklySlots: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
          calendar: {
            dateFrom: '2026-01-01',
            dateTo: '2026-03-31',
            rolling: true,
          },
        },
      },
    ]);

    const mockPrisma = {
      group: {
        findMany: findManyGroups,
        update: groupUpdate,
      },
      lesson: {
        createMany,
        findMany: findManyLessons,
        count: vi.fn().mockResolvedValue(12),
      },
    };

    service = new GroupScheduleRollingService(mockPrisma as never);
  });

  it('extends horizon by 90 days when dateTo is within lead window', async () => {
    // 2026-03-31 is within 14 days of 2026-04-05 → should extend
    const result = await service.extendAllRollingWindows(new Date('2026-04-05T12:00:00Z'));

    expect(result.extended).toBe(1);
    expect(createMany).toHaveBeenCalled();
    expect(groupUpdate).toHaveBeenCalled();
    const updateArg = groupUpdate.mock.calls[0]?.[0] as {
      data: { schedule: { calendar: { dateTo: string; rolling: boolean } } };
    };
    expect(updateArg.data.schedule.calendar.dateTo).toBe('2026-06-29'); // 2026-03-31 + 90
    expect(updateArg.data.schedule.calendar.rolling).toBe(true);
  });

  it('skips groups whose horizon still has more than lead days remaining', async () => {
    const result = await service.extendAllRollingWindows(new Date('2026-01-15T12:00:00Z'));

    expect(result.extended).toBe(0);
    expect(result.skipped).toBe(1);
    expect(createMany).not.toHaveBeenCalled();
  });
});
