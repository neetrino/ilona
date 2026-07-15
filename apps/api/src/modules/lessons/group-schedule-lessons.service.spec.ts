import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { getCalendarDateInTimezone } from '@ilona/types';
import { GroupScheduleLessonsService } from './group-schedule-lessons.service';

const TEACHER_1 = 'teacher-anna';
const TEACHER_2 = 'teacher-ellen';
const GROUP_ID = 'group-idaho';

type CreatedLessonRow = {
  teacherId: string;
  scheduledAt: Date;
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

describe('GroupScheduleLessonsService — lesson-by-lesson teacher rotation', () => {
  let service: GroupScheduleLessonsService;
  let createMany: Mock;
  let deleteMany: Mock;
  let findMany: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    createMany = vi.fn().mockResolvedValue({ count: 0 });
    deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    findMany = vi.fn().mockResolvedValue([]);

    const mockPrisma = {
      lesson: {
        createMany,
        deleteMany,
        findMany,
        updateMany: vi.fn(),
      },
    };

    service = new GroupScheduleLessonsService(mockPrisma as never);
  });

  it('assigns T1, T2, T1, T2… for Mon/Wed/Fri schedule (not whole-week blocks)', async () => {
    await service.syncAfterGroupSaved({
      groupId: GROUP_ID,
      teacherId: TEACHER_1,
      secondTeacherId: TEACHER_2,
      secondTeacherStartsFirstWeek: false,
      weeklySlots: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '11:00' },
      ],
      calendar: {
        dateFrom: '2026-06-29',
        dateTo: '2026-07-10',
      },
      previousScheduleJson: null,
      previousTeacherId: null,
      previousSecondTeacherId: null,
      previousSecondTeacherStartsFirstWeek: null,
    });

    expect(createMany).toHaveBeenCalledTimes(1);
    const created = getCreateManyData(createMany);

    expect(created).toHaveLength(6);

    const byYmd = created.map((lesson) => ({
      ymd: getCalendarDateInTimezone(lesson.scheduledAt),
      teacherId: lesson.teacherId,
    }));

    expect(byYmd).toEqual([
      { ymd: '2026-06-29', teacherId: TEACHER_1 }, // Mon → T1
      { ymd: '2026-07-01', teacherId: TEACHER_2 }, // Wed → T2
      { ymd: '2026-07-03', teacherId: TEACHER_1 }, // Fri → T1
      { ymd: '2026-07-06', teacherId: TEACHER_2 }, // next Mon → T2 (continues, not weekly reset)
      { ymd: '2026-07-08', teacherId: TEACHER_1 }, // Wed → T1
      { ymd: '2026-07-10', teacherId: TEACHER_2 }, // Fri → T2
    ]);

    // Old weekly logic would put all three first-week lessons on T1 — assert that failed pattern.
    const firstWeekTeachers = byYmd.slice(0, 3).map((row) => row.teacherId);
    expect(firstWeekTeachers).not.toEqual([TEACHER_1, TEACHER_1, TEACHER_1]);
    expect(firstWeekTeachers).toEqual([TEACHER_1, TEACHER_2, TEACHER_1]);
  });

  it('starts with Teacher 2 when secondTeacherStartsFirstWeek is true', async () => {
    await service.syncAfterGroupSaved({
      groupId: GROUP_ID,
      teacherId: TEACHER_1,
      secondTeacherId: TEACHER_2,
      secondTeacherStartsFirstWeek: true,
      weeklySlots: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
      ],
      calendar: {
        dateFrom: '2026-06-29',
        dateTo: '2026-07-01',
      },
      previousScheduleJson: null,
      previousTeacherId: null,
      previousSecondTeacherId: null,
      previousSecondTeacherStartsFirstWeek: null,
    });

    const created = getCreateManyData(createMany);
    expect(created.map((l) => l.teacherId)).toEqual([TEACHER_2, TEACHER_1]);
  });
});
