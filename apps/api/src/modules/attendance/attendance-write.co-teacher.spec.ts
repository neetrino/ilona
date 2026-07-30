import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UserRole } from '@ilona/database';
import { AttendanceWriteService } from './attendance-write.service';

const TEACHER_X = 'teacher-x';
const TEACHER_Y = 'teacher-y';
const USER_X = 'user-x';
const USER_OUTSIDER = 'user-outsider';
const OUTSIDER = 'teacher-outsider';
const LESSON_ID = 'lesson-y-day';
const STUDENT_ID = 'student-1';
const GROUP_ID = 'group-xy';

describe('AttendanceWriteService — co-teacher access vs pay', () => {
  let service: AttendanceWriteService;
  let lessonFindUnique: Mock;
  let teacherFindUnique: Mock;
  let studentFindUnique: Mock;
  let transaction: Mock;
  let recalculateSalaryForMonth: Mock;
  let getManagerCenterId: Mock;

  const yDayLesson = {
    id: LESSON_ID,
    groupId: GROUP_ID,
    teacherId: TEACHER_Y,
    substituteTeacherId: null,
    scheduledAt: new Date('2026-07-30T10:00:00'),
    group: {
      id: GROUP_ID,
      teacherId: TEACHER_X,
      secondTeacherId: TEACHER_Y,
      centerId: 'center-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lessonFindUnique = vi.fn();
    teacherFindUnique = vi.fn();
    studentFindUnique = vi.fn();
    transaction = vi.fn();
    recalculateSalaryForMonth = vi.fn().mockResolvedValue(undefined);
    getManagerCenterId = vi.fn().mockResolvedValue(null);

    const prisma = {
      lesson: { findUnique: lessonFindUnique },
      teacher: { findUnique: teacherFindUnique },
      student: { findUnique: studentFindUnique },
      $transaction: transaction,
    };

    service = new AttendanceWriteService(
      prisma as never,
      { getManagerCenterId } as never,
      { checkAbsenceThreshold: vi.fn() } as never,
      { recalculateSalaryForMonth } as never,
    );
  });

  it('allows Teacher X to mark attendance on Teacher Y lesson day', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: TEACHER_X, userId: USER_X });
    studentFindUnique.mockResolvedValue({ id: STUDENT_ID, groupId: GROUP_ID });
    transaction.mockResolvedValue({
      attendance: { id: 'att-1', lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
      lessonCompletedForAbsence: false,
      lessonScheduledAt: null,
      lessonTeacherId: null,
    });

    const result = await service.markAttendance(
      { lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
      USER_X,
      UserRole.TEACHER,
    );

    expect(result.id).toBe('att-1');
    expect(recalculateSalaryForMonth).not.toHaveBeenCalled();
  });

  it('forbids an outsider teacher from marking attendance on the group lesson', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: OUTSIDER, userId: USER_OUTSIDER });

    await expect(
      service.markAttendance(
        { lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
        USER_OUTSIDER,
        UserRole.TEACHER,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('recalculates salary for assigned Teacher Y when co-teacher X completes absences', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: TEACHER_X, userId: USER_X });
    studentFindUnique.mockResolvedValue({ id: STUDENT_ID, groupId: GROUP_ID });
    transaction.mockResolvedValue({
      attendance: { id: 'att-1', lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
      lessonCompletedForAbsence: true,
      lessonScheduledAt: yDayLesson.scheduledAt,
      lessonTeacherId: TEACHER_Y,
    });

    await service.markAttendance(
      { lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
      USER_X,
      UserRole.TEACHER,
    );

    expect(recalculateSalaryForMonth).toHaveBeenCalledTimes(1);
    expect(recalculateSalaryForMonth).toHaveBeenCalledWith(TEACHER_Y, yDayLesson.scheduledAt);
    expect(recalculateSalaryForMonth).not.toHaveBeenCalledWith(TEACHER_X, expect.anything());
  });

  it('allows Teacher Y (assigned) to mark their own lesson day', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: TEACHER_Y, userId: 'user-y' });
    studentFindUnique.mockResolvedValue({ id: STUDENT_ID, groupId: GROUP_ID });
    transaction.mockResolvedValue({
      attendance: { id: 'att-2' },
      lessonCompletedForAbsence: false,
      lessonScheduledAt: null,
      lessonTeacherId: null,
    });

    await expect(
      service.markAttendance(
        { lessonId: LESSON_ID, studentId: STUDENT_ID, isPresent: true },
        'user-y',
        UserRole.TEACHER,
      ),
    ).resolves.toBeTruthy();
  });

  it('rejects when lesson does not exist', async () => {
    lessonFindUnique.mockResolvedValue(null);

    await expect(
      service.markAttendance(
        { lessonId: 'missing', studentId: STUDENT_ID, isPresent: true },
        USER_X,
        UserRole.TEACHER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
