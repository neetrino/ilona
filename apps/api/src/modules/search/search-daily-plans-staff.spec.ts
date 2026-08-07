import { describe, expect, it, vi } from 'vitest';
import { SearchStaffService } from './search-staff.service';

describe('SearchStaffService.searchDailyPlansStaff', () => {
  it('returns daily plan hits with topic title and planId href', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'plan-fear',
        date: new Date('2026-05-22T00:00:00.000Z'),
        teacher: { user: { firstName: 'Ilona', lastName: 'Sahakyan' } },
        group: { name: 'A1 Adults' },
        topics: [{ title: 'The fear of being ordinary' }],
      },
      {
        id: 'plan with spaces',
        date: new Date('2026-07-15T00:00:00.000Z'),
        teacher: { user: { firstName: 'Stella', lastName: 'Sargsyan' } },
        group: null,
        topics: [],
      },
    ]);

    const service = new SearchStaffService({
      dailyPlan: { findMany },
    } as never);

    const results = await service.searchDailyPlansStaff('The fear of being ordinary', 10, undefined);

    expect(findMany).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);

    expect(results[0]).toMatchObject({
      id: 'plan-fear',
      type: 'daily_plan',
      title: 'The fear of being ordinary',
      subtitle: 'Ilona Sahakyan · A1 Adults',
      badge: 'Daily Plan',
      href: '/admin/daily-plan?planId=plan-fear',
      description: '2026-05-22T00:00:00.000Z',
    });

    expect(results[1]).toMatchObject({
      id: 'plan with spaces',
      type: 'daily_plan',
      title: 'Stella Sargsyan',
      subtitle: 'Stella Sargsyan',
      href: `/admin/daily-plan?planId=${encodeURIComponent('plan with spaces')}`,
    });
  });

  it('scopes manager queries by center via group or lesson.group', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new SearchStaffService({
      dailyPlan: { findMany },
    } as never);

    await service.searchDailyPlansStaff('fear', 5, 'center-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        where: {
          AND: [
            expect.any(Object),
            {
              OR: [{ group: { centerId: 'center-1' } }, { lesson: { group: { centerId: 'center-1' } } }],
            },
          ],
        },
      }),
    );
  });

  it('uses the same topic-title search clause as the daily-plan page', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new SearchStaffService({
      dailyPlan: { findMany },
    } as never);

    await service.searchDailyPlansStaff('The fear of being ordinary', 8, undefined);

    const firstArg = findMany.mock.calls[0]?.[0] as
      | { where: { AND: Array<{ OR?: Array<Record<string, unknown>> }> } }
      | undefined;
    expect(firstArg).toBeDefined();

    const searchOr = firstArg!.where.AND[0]?.OR ?? [];
    const topicsClause = searchOr.find((clause) => 'topics' in clause) as
      | { topics: { some: { OR: unknown[] } } }
      | undefined;
    expect(topicsClause).toBeDefined();
    expect(topicsClause!.topics.some.OR).toContainEqual({
      title: { contains: 'The fear of being ordinary', mode: 'insensitive' },
    });
  });
});

