import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { addCalendarDays, getCalendarDateInTimezone } from '@ilona/types';
import { GroupScheduleLessonsService } from './group-schedule-lessons.service';
import { GroupScheduleRollingService } from './group-schedule-rolling.service';
import {
  GROUP_SCHEDULE_ROLLING_DAYS,
  GROUP_SCHEDULE_EXTEND_LEAD_DAYS,
  dayAfterYmd,
  daysUntilYmd,
  scheduleHorizonFromStart,
} from '../groups/group-schedule-rolling';

const TEACHER_1 = 'teacher-anna';
const TEACHER_2 = 'teacher-ellen';
const GROUP_ID = 'group-90d-e2e';

type CreatedLessonRow = {
  teacherId: string;
  scheduledAt: Date;
  creationSource?: string;
};

function getCreateManyData(createManyMock: Mock): CreatedLessonRow[] {
  const firstCall = createManyMock.mock.calls[0] as unknown as
    | [{ data: CreatedLessonRow[] }]
    | undefined;
  if (!firstCall?.[0]?.data) {
    throw new Error('Expected lesson.createMany to be called with { data }');
  }
  return firstCall[0].data;
}

describe('90-day rolling schedule — real behavior checks', () => {
  it('horizon helpers: start + 90 and extend window math', () => {
    expect(GROUP_SCHEDULE_ROLLING_DAYS).toBe(90);
    expect(GROUP_SCHEDULE_EXTEND_LEAD_DAYS).toBe(14);

    expect(scheduleHorizonFromStart('2026-07-15')).toBe('2026-10-13'); // +90
    expect(dayAfterYmd('2026-10-13')).toBe('2026-10-14');

    // After first window ends 2026-10-13, next window ends 2026-10-13+90
    expect(scheduleHorizonFromStart('2026-10-13')).toBe('2027-01-11');

    expect(daysUntilYmd('2026-07-29', new Date('2026-07-15T12:00:00Z'))).toBe(14);
    expect(daysUntilYmd('2026-07-30', new Date('2026-07-15T12:00:00Z'))).toBe(15);
  });

  describe('initial generation covers ~90 calendar days', () => {
    let syncService: GroupScheduleLessonsService;
    let createMany: Mock;
    let deleteMany: Mock;
    let findMany: Mock;
    let count: Mock;

    beforeEach(() => {
      vi.clearAllMocks();
      createMany = vi.fn().mockResolvedValue({ count: 0 });
      deleteMany = vi.fn().mockResolvedValue({ count: 0 });
      findMany = vi.fn().mockResolvedValue([]);
      count = vi.fn().mockResolvedValue(0);

      syncService = new GroupScheduleLessonsService({
        lesson: { createMany, deleteMany, findMany, updateMany: vi.fn(), count },
      } as never);
    });

    it('creates Mon/Wed/Fri lessons across a full 90-day window (~39 sessions)', async () => {
      const dateFrom = '2026-07-15';
      const dateTo = scheduleHorizonFromStart(dateFrom); // 2026-10-13

      await syncService.syncAfterGroupSaved({
        groupId: GROUP_ID,
        teacherId: TEACHER_1,
        secondTeacherId: TEACHER_2,
        secondTeacherStartsFirstWeek: false,
        weeklySlots: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
          { dayOfWeek: 5, startTime: '10:00', endTime: '11:00' },
        ],
        calendar: { dateFrom, dateTo, rolling: true },
        previousScheduleJson: null,
        previousTeacherId: null,
        previousSecondTeacherId: null,
        previousSecondTeacherStartsFirstWeek: null,
      });

      const created = getCreateManyData(createMany);
      expect(created.length).toBeGreaterThanOrEqual(38);
      expect(created.length).toBeLessThanOrEqual(40);

      const ymds = created.map((l) => getCalendarDateInTimezone(l.scheduledAt)).sort();
      expect(ymds[0]).toBe('2026-07-15'); // Wed
      expect(ymds[ymds.length - 1] <= dateTo).toBe(true);
      expect(ymds[ymds.length - 1] >= addCalendarDays(dateTo, -6)).toBe(true);

      // Alternating teachers across the full window
      expect(created[0].teacherId).toBe(TEACHER_1);
      expect(created[1].teacherId).toBe(TEACHER_2);
      expect(created.every((l) => l.creationSource === 'GROUP_SCHEDULE')).toBe(true);
    });
  });

  describe('cron extend appends next 90 days without wiping the past', () => {
    let rollingService: GroupScheduleRollingService;
    let createMany: Mock;
    let groupUpdate: Mock;
    let findManyGroups: Mock;
    let findManyLessons: Mock;
    let count: Mock;

    beforeEach(() => {
      vi.clearAllMocks();
      createMany = vi.fn().mockResolvedValue({ count: 0 });
      groupUpdate = vi.fn().mockResolvedValue({});
      findManyLessons = vi.fn().mockResolvedValue([]);
      count = vi.fn().mockResolvedValue(39);
      findManyGroups = vi.fn().mockResolvedValue([
        {
          id: GROUP_ID,
          teacherId: TEACHER_1,
          secondTeacherId: TEACHER_2,
          secondTeacherStartsFirstWeek: false,
          schedule: {
            weeklySlots: [
              { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
              { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
              { dayOfWeek: 5, startTime: '10:00', endTime: '11:00' },
            ],
            calendar: {
              dateFrom: '2026-07-15',
              dateTo: '2026-10-13',
              rolling: true,
            },
          },
        },
      ]);

      rollingService = new GroupScheduleRollingService({
        group: { findMany: findManyGroups, update: groupUpdate },
        lesson: { createMany, findMany: findManyLessons, count },
      } as never);
    });

    it('extends when within lead days and advances dateTo by +90', async () => {
      // 10 days before horizon end → must extend
      const result = await rollingService.extendAllRollingWindows(
        new Date('2026-10-03T12:00:00Z'),
      );

      expect(result.extended).toBe(1);
      expect(result.failed).toBe(0);
      expect(createMany).toHaveBeenCalledTimes(1);

      const created = getCreateManyData(createMany);
      expect(created.length).toBeGreaterThanOrEqual(38);
      expect(created.length).toBeLessThanOrEqual(40);

      const ymds = created.map((l) => getCalendarDateInTimezone(l.scheduledAt)).sort();
      expect(ymds[0]).toBe('2026-10-14'); // day after old dateTo
      expect(ymds[ymds.length - 1] <= '2027-01-11').toBe(true);

      // Must NOT call delete — extend is append-only
      expect(groupUpdate).toHaveBeenCalled();
      const updated = groupUpdate.mock.calls[0]?.[0] as {
        data: { schedule: { calendar: { dateFrom: string; dateTo: string; rolling: boolean } } };
      };
      expect(updated.data.schedule.calendar.dateFrom).toBe('2026-07-15'); // start unchanged
      expect(updated.data.schedule.calendar.dateTo).toBe('2027-01-11');
      expect(updated.data.schedule.calendar.rolling).toBe(true);
    });

    it('does not extend when plenty of days remain', async () => {
      const result = await rollingService.extendAllRollingWindows(
        new Date('2026-08-01T12:00:00Z'),
      );
      expect(result.extended).toBe(0);
      expect(result.skipped).toBe(1);
      expect(createMany).not.toHaveBeenCalled();
    });
  });
});
