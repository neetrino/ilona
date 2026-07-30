import { ForbiddenException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UserRole } from '@ilona/database';
import { FeedbackWriteService } from './feedback-write.service';

const TEACHER_X = 'teacher-x';
const TEACHER_Y = 'teacher-y';
const USER_X = 'user-x';
const USER_OUTSIDER = 'user-outsider';
const OUTSIDER = 'teacher-outsider';
const LESSON_ID = 'lesson-y-day';
const STUDENT_ID = 'student-1';

describe('FeedbackWriteService — co-teacher access', () => {
  let service: FeedbackWriteService;
  let lessonFindUnique: Mock;
  let teacherFindUnique: Mock;
  let feedbackFindUnique: Mock;
  let feedbackCreate: Mock;
  let feedbackUpdate: Mock;
  let feedbackDelete: Mock;
  let syncLessonFeedbacksCompleted: Mock;

  const yDayLesson = {
    id: LESSON_ID,
    teacherId: TEACHER_Y,
    substituteTeacherId: null,
    group: {
      teacherId: TEACHER_X,
      secondTeacherId: TEACHER_Y,
      students: [{ id: STUDENT_ID }],
    },
    teacher: { id: TEACHER_Y },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lessonFindUnique = vi.fn();
    teacherFindUnique = vi.fn();
    feedbackFindUnique = vi.fn();
    feedbackCreate = vi.fn();
    feedbackUpdate = vi.fn();
    feedbackDelete = vi.fn();
    syncLessonFeedbacksCompleted = vi.fn().mockResolvedValue(undefined);

    const prisma = {
      lesson: { findUnique: lessonFindUnique },
      teacher: { findUnique: teacherFindUnique },
      feedback: {
        findUnique: feedbackFindUnique,
        create: feedbackCreate,
        update: feedbackUpdate,
        delete: feedbackDelete,
      },
    };

    service = new FeedbackWriteService(prisma as never, {
      syncLessonFeedbacksCompleted,
    } as never);
  });

  it('allows Teacher X to create feedback on Teacher Y lesson day', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: TEACHER_X, userId: USER_X });
    feedbackFindUnique.mockResolvedValue(null);
    feedbackCreate.mockResolvedValue({
      id: 'fb-1',
      lessonId: LESSON_ID,
      studentId: STUDENT_ID,
      teacherId: TEACHER_X,
    });

    const result = await service.createOrUpdate(
      { lessonId: LESSON_ID, studentId: STUDENT_ID, content: 'Good work', rating: 5 },
      USER_X,
      UserRole.TEACHER,
    );

    expect(result.id).toBe('fb-1');
    expect(feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teacherId: TEACHER_X,
          lessonId: LESSON_ID,
        }),
      }),
    );
    expect(syncLessonFeedbacksCompleted).toHaveBeenCalledWith(LESSON_ID);
  });

  it('forbids outsider from creating feedback on the group lesson', async () => {
    lessonFindUnique.mockResolvedValue(yDayLesson);
    teacherFindUnique.mockResolvedValue({ id: OUTSIDER, userId: USER_OUTSIDER });

    await expect(
      service.createOrUpdate(
        { lessonId: LESSON_ID, studentId: STUDENT_ID, content: 'Nope', rating: 1 },
        USER_OUTSIDER,
        UserRole.TEACHER,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(feedbackCreate).not.toHaveBeenCalled();
  });

  it('allows Teacher X to update existing feedback on Teacher Y lesson', async () => {
    feedbackFindUnique.mockResolvedValue({
      id: 'fb-1',
      teacherId: TEACHER_Y,
      lessonId: LESSON_ID,
      lesson: yDayLesson,
    });
    teacherFindUnique.mockResolvedValue({ id: TEACHER_X, userId: USER_X });
    feedbackUpdate.mockResolvedValue({ id: 'fb-1', content: 'Updated' });

    const result = await service.update(
      'fb-1',
      { content: 'Updated', rating: 4 },
      USER_X,
      UserRole.TEACHER,
    );

    expect(result.id).toBe('fb-1');
    expect(feedbackUpdate).toHaveBeenCalled();
  });

  it('allows Teacher X to delete feedback authored by Teacher Y on shared group lesson', async () => {
    feedbackFindUnique.mockResolvedValue({
      id: 'fb-1',
      teacherId: TEACHER_Y,
      lessonId: LESSON_ID,
      lesson: {
        teacherId: TEACHER_Y,
        substituteTeacherId: null,
        group: { teacherId: TEACHER_X, secondTeacherId: TEACHER_Y },
      },
    });
    teacherFindUnique.mockResolvedValue({ id: TEACHER_X, userId: USER_X });
    feedbackDelete.mockResolvedValue({ id: 'fb-1', lessonId: LESSON_ID });

    await service.delete('fb-1', USER_X, UserRole.TEACHER);

    expect(feedbackDelete).toHaveBeenCalled();
    expect(syncLessonFeedbacksCompleted).toHaveBeenCalledWith(LESSON_ID);
  });

  it('forbids outsider from deleting feedback on the group lesson', async () => {
    feedbackFindUnique.mockResolvedValue({
      id: 'fb-1',
      teacherId: TEACHER_Y,
      lessonId: LESSON_ID,
      lesson: {
        teacherId: TEACHER_Y,
        substituteTeacherId: null,
        group: { teacherId: TEACHER_X, secondTeacherId: TEACHER_Y },
      },
    });
    teacherFindUnique.mockResolvedValue({ id: OUTSIDER, userId: USER_OUTSIDER });

    await expect(service.delete('fb-1', USER_OUTSIDER, UserRole.TEACHER)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
