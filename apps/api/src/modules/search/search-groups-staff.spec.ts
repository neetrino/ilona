import { describe, expect, it, vi } from 'vitest';
import { SearchStaffService } from './search-staff.service';

describe('SearchStaffService.searchGroupsStaff', () => {
  it('navigates group hits to the detail view page, not the edit modal', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'grp-connecticut',
        name: 'Connecticut',
        center: { name: 'Andranik 40/55' },
      },
      {
        id: 'grp with spaces',
        name: 'Ohio',
        center: null,
      },
    ]);

    const service = new SearchStaffService({
      group: { findMany },
    } as never);

    const results = await service.searchGroupsStaff(['conn'], 10, undefined);

    expect(findMany).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);

    expect(results[0]).toMatchObject({
      id: 'grp-connecticut',
      type: 'group',
      title: 'Connecticut',
      subtitle: 'Andranik 40/55',
      badge: 'Group',
      href: '/admin/groups/view/grp-connecticut',
    });
    expect(results[0].href).not.toContain('editGroup');

    expect(results[1].href).toBe(
      `/admin/groups/view/${encodeURIComponent('grp with spaces')}`,
    );
    expect(results[1].href).not.toContain('editGroup');
  });

  it('forwards center scope to the prisma query', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new SearchStaffService({
      group: { findMany },
    } as never);

    await service.searchGroupsStaff(['ohio'], 5, 'center-1');

    const firstArg = findMany.mock.calls[0]?.[0] as
      | { take: number; where: { centerId?: string } }
      | undefined;
    expect(firstArg).toBeDefined();
    expect(firstArg!.take).toBe(5);
    expect(firstArg!.where.centerId).toBe('center-1');
  });
});

