import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let lessonsService: LessonsService;
  const crudService = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByTeacher: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setSubstituteForGroupDay: vi.fn(),
  };
  const statusService = {
    startLesson: vi.fn(),
    completeLesson: vi.fn(),
    cancelLesson: vi.fn(),
  };
  const actionsService = {
    markVocabularySent: vi.fn(),
  };
  const schedulingService = {
    getUpcoming: vi.fn(),
  };
  const statisticsService = {
    getLessonStatistics: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lessonsService = new LessonsService(
      crudService as never,
      statusService as never,
      actionsService as never,
      schedulingService as never,
      statisticsService as never,
    );
  });

  it('delegates findById', async () => {
    crudService.findById.mockResolvedValue({ id: 'lesson-1' });
    await expect(lessonsService.findById('lesson-1')).resolves.toEqual({ id: 'lesson-1' });
    expect(crudService.findById).toHaveBeenCalledWith('lesson-1', undefined, undefined);
  });

  it('delegates create', async () => {
    const dto = { groupId: 'g1', teacherId: 't1', scheduledAt: new Date().toISOString() };
    crudService.create.mockResolvedValue({ id: 'lesson-1', ...dto });
    await lessonsService.create(dto as never);
    expect(crudService.create).toHaveBeenCalledWith(dto, undefined, undefined);
  });

  it('delegates update', async () => {
    crudService.update.mockResolvedValue({ id: 'lesson-1', topic: 'Updated' });
    await lessonsService.update('lesson-1', { topic: 'Updated' } as never);
    expect(crudService.update).toHaveBeenCalledWith(
      'lesson-1',
      { topic: 'Updated' },
      undefined,
      undefined,
    );
  });

  it('delegates startLesson', async () => {
    statusService.startLesson.mockResolvedValue({ id: 'lesson-1', status: 'IN_PROGRESS' });
    await lessonsService.startLesson('lesson-1', 'user-1', 'TEACHER' as never);
    expect(statusService.startLesson).toHaveBeenCalledWith('lesson-1', 'user-1', 'TEACHER');
  });

  it('delegates completeLesson', async () => {
    statusService.completeLesson.mockResolvedValue({ id: 'lesson-1', status: 'COMPLETED' });
    await lessonsService.completeLesson('lesson-1', {} as never, 'user-1', 'TEACHER' as never);
    expect(statusService.completeLesson).toHaveBeenCalled();
  });

  it('delegates cancelLesson', async () => {
    statusService.cancelLesson.mockResolvedValue({ id: 'lesson-1', status: 'CANCELLED' });
    await lessonsService.cancelLesson('lesson-1');
    expect(statusService.cancelLesson).toHaveBeenCalledWith(
      'lesson-1',
      undefined,
      undefined,
      undefined,
    );
  });

  it('delegates getLessonStatistics', async () => {
    statisticsService.getLessonStatistics.mockResolvedValue({ total: 10 });
    await lessonsService.getLessonStatistics('teacher-1');
    expect(statisticsService.getLessonStatistics).toHaveBeenCalledWith(
      'teacher-1',
      undefined,
      undefined,
      undefined,
    );
  });

  it('delegates setSubstituteForGroupDay', async () => {
    crudService.setSubstituteForGroupDay.mockResolvedValue({ updatedCount: 2 });
    await lessonsService.setSubstituteForGroupDay(
      { groupId: 'g1', date: '2026-09-24', substituteTeacherId: 't2' },
      'user-1',
      'ADMIN' as never,
    );
    expect(crudService.setSubstituteForGroupDay).toHaveBeenCalled();
  });
});
