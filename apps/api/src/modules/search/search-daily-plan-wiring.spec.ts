import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '@ilona/database';
import { SearchService } from './search.service';

describe('SearchService daily plan wiring', () => {
  it('includes staff daily plan hits for ADMIN', async () => {
    const staffService = {
      searchStudentsStaff: vi.fn().mockResolvedValue([]),
      searchTeachersStaff: vi.fn().mockResolvedValue([]),
      searchGroupsStaff: vi.fn().mockResolvedValue([]),
      searchCrmLeadsStaff: vi.fn().mockResolvedValue([]),
      searchLessonsStaff: vi.fn().mockResolvedValue([]),
      searchPaymentsStaff: vi.fn().mockResolvedValue([]),
      searchRecordingsStaff: vi.fn().mockResolvedValue([]),
      searchDailyPlansStaff: vi.fn().mockResolvedValue([
        {
          id: 'plan-fear',
          type: 'daily_plan',
          title: 'The fear of being ordinary',
          href: '/admin/daily-plan?planId=plan-fear',
          badge: 'Daily Plan',
        },
      ]),
    };
    const roleQueryService = {
      searchTeacherEntities: vi.fn(),
      searchStudentEntities: vi.fn(),
    };

    const service = new SearchService(staffService as never, roleQueryService as never);
    const results = await service.globalSearch(
      { sub: 'admin-1', role: UserRole.ADMIN, email: 'admin@ilona.edu' } as never,
      'The fear of being ordinary',
      20,
    );

    expect(staffService.searchDailyPlansStaff).toHaveBeenCalledWith(
      'The fear of being ordinary',
      expect.any(Number),
      undefined,
    );
    expect(results.some((r) => r.type === 'daily_plan' && r.title === 'The fear of being ordinary')).toBe(
      true,
    );
  });

  it('passes normalized query into teacher daily plan search', async () => {
    const staffService = {
      searchStudentsStaff: vi.fn(),
      searchTeachersStaff: vi.fn(),
      searchGroupsStaff: vi.fn(),
      searchCrmLeadsStaff: vi.fn(),
      searchLessonsStaff: vi.fn(),
      searchPaymentsStaff: vi.fn(),
      searchRecordingsStaff: vi.fn(),
      searchDailyPlansStaff: vi.fn(),
    };
    const roleQueryService = {
      searchTeacherEntities: vi.fn().mockResolvedValue([
        {
          id: 'plan-1',
          type: 'daily_plan',
          title: 'The fear of being ordinary',
          href: '/teacher/daily-plan?planId=plan-1',
        },
      ]),
      searchStudentEntities: vi.fn(),
    };

    const service = new SearchService(staffService as never, roleQueryService as never);
    await service.globalSearch(
      { sub: 'teacher-user', role: UserRole.TEACHER, email: 't@ilona.edu' } as never,
      'The fear of being ordinary',
    );

    expect(roleQueryService.searchTeacherEntities).toHaveBeenCalledWith(
      'teacher-user',
      ['The', 'fear', 'of', 'being', 'ordinary'],
      'The fear of being ordinary',
      expect.any(Number),
    );
  });
});
