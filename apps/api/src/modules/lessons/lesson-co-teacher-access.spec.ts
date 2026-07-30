import { ForbiddenException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UserRole } from '@ilona/database';
import { LessonReadService } from './lesson-read.service';
import { LessonListService } from './lesson-list.service';
import { lessonsAccessibleToTeacherWhere } from '../../common/lesson-instructor';

const TEACHER_X = 'teacher-x';
const TEACHER_Y = 'teacher-y';
const USER_X = 'user-x';
const USER_OUTSIDER = 'user-outsider';
const OUTSIDER = 'teacher-outsider';

describe('Lesson access — co-teacher equal rights', () => {
  describe('LessonReadService.findById', () => {
    let service: LessonReadService;
    let lessonFindUnique: Mock;
    let teacherFindUnique: Mock;
    let enrichLesson: Mock;

    const yDayLesson = {
      id: 'lesson-y',
      groupId: 'group-xy',
      teacherId: TEACHER_Y,
      substituteTeacherId: null,
      group: {
        teacherId: TEACHER_X,
        secondTeacherId: TEACHER_Y,
        centerId: 'center-1',
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();
      lessonFindUnique = vi.fn();
      teacherFindUnique = vi.fn();
      enrichLesson = vi.fn((lesson: unknown) => lesson);

      service = new LessonReadService(
        {
          lesson: { findUnique: lessonFindUnique },
          teacher: { findUnique: teacherFindUnique },
          student: { findUnique: vi.fn() },
        } as never,
        { enrichLesson } as never,
        { getManagerCenterId: vi.fn().mockResolvedValue(null) } as never,
      );
    });

    it('allows Teacher X to open Teacher Y lesson detail', async () => {
      lessonFindUnique.mockResolvedValue(yDayLesson);
      teacherFindUnique.mockResolvedValue({ id: TEACHER_X });

      await expect(
        service.findById('lesson-y', USER_X, UserRole.TEACHER),
      ).resolves.toMatchObject({ id: 'lesson-y', teacherId: TEACHER_Y });
    });

    it('forbids outsider from opening the lesson', async () => {
      lessonFindUnique.mockResolvedValue(yDayLesson);
      teacherFindUnique.mockResolvedValue({ id: OUTSIDER });

      await expect(
        service.findById('lesson-y', USER_OUTSIDER, UserRole.TEACHER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('LessonListService.findAll teacher scope', () => {
    let service: LessonListService;
    let teacherFindUnique: Mock;
    let lessonFindMany: Mock;
    let lessonCount: Mock;

    beforeEach(() => {
      vi.clearAllMocks();
      teacherFindUnique = vi.fn();
      lessonFindMany = vi.fn().mockResolvedValue([]);
      lessonCount = vi.fn().mockResolvedValue(0);

      service = new LessonListService(
        {
          teacher: { findUnique: teacherFindUnique },
          lesson: { findMany: lessonFindMany, count: lessonCount },
          student: { findUnique: vi.fn() },
        } as never,
        { enrichLesson: (l: unknown) => l } as never,
        { getManagerCenterId: vi.fn().mockResolvedValue(null) } as never,
      );
    });

    it('scopes teacher lesson list with co-teacher accessible where (not pay-only)', async () => {
      teacherFindUnique.mockResolvedValue({ id: TEACHER_X });

      await service.findAll({
        currentUserId: USER_X,
        userRole: UserRole.TEACHER,
      });

      expect(lessonFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(lessonsAccessibleToTeacherWhere(TEACHER_X)),
        }),
      );
    });
  });
});
