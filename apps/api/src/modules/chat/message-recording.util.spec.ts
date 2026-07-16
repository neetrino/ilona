import { describe, expect, it } from 'vitest';
import {
  adminRecordingMatchesFilters,
  applyRecordingPagination,
  resolveAdminRecordingGroupIds,
  resolveAdminRecordingStudentIds,
} from './message-recording.util';

describe('message-recording.util', () => {
  describe('resolveAdminRecordingStudentIds', () => {
    it('prefers studentIds over legacy studentUserId', () => {
      expect(
        resolveAdminRecordingStudentIds({
          studentIds: ['a', 'b'],
          studentUserId: 'legacy',
        }),
      ).toEqual(['a', 'b']);
    });

    it('falls back to studentUserId', () => {
      expect(resolveAdminRecordingStudentIds({ studentUserId: 'legacy' })).toEqual(['legacy']);
    });
  });

  describe('resolveAdminRecordingGroupIds', () => {
    it('prefers groupIds over legacy groupId', () => {
      expect(
        resolveAdminRecordingGroupIds({
          groupIds: ['g1'],
          groupId: 'legacy',
        }),
      ).toEqual(['g1']);
    });
  });

  describe('adminRecordingMatchesFilters', () => {
    it('matches student id when only student filter is set', () => {
      expect(
        adminRecordingMatchesFilters('u1', 'g1', { studentIds: ['u1'] }),
      ).toBe(true);
      expect(
        adminRecordingMatchesFilters('u2', 'g1', { studentIds: ['u1'] }),
      ).toBe(false);
    });

    it('matches ungrouped group filter', () => {
      expect(
        adminRecordingMatchesFilters('u1', null, { groupIds: ['ungrouped'] }),
      ).toBe(true);
      expect(
        adminRecordingMatchesFilters('u1', 'g1', { groupIds: ['ungrouped'] }),
      ).toBe(false);
    });
  });

  describe('applyRecordingPagination', () => {
    const items = [1, 2, 3, 4, 5];

    it('returns all items when take is omitted', () => {
      expect(applyRecordingPagination(items)).toEqual(items);
      expect(applyRecordingPagination(items, { skip: 2 })).toEqual([3, 4, 5]);
    });

    it('slices by skip and take', () => {
      expect(applyRecordingPagination(items, { skip: 1, take: 2 })).toEqual([2, 3]);
    });
  });
});
