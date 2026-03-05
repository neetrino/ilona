import { describe, it, expect } from 'vitest';
import {
  getAllowedNextStatuses,
  canTransition,
  requireFieldsForTransition,
  CRM_COLUMN_ORDER,
} from './crm-status.machine';

describe('CrmStatusMachine', () => {
  describe('getAllowedNextStatuses', () => {
    it('returns FIRST_LESSON and ARCHIVE for NEW', () => {
      expect(getAllowedNextStatuses('NEW')).toEqual(['FIRST_LESSON', 'ARCHIVE']);
    });
    it('returns PAID and ARCHIVE for FIRST_LESSON', () => {
      expect(getAllowedNextStatuses('FIRST_LESSON')).toEqual(['PAID', 'ARCHIVE']);
    });
    it('returns FIRST_LESSON and ARCHIVE for WAITLIST', () => {
      expect(getAllowedNextStatuses('WAITLIST')).toEqual(['FIRST_LESSON', 'ARCHIVE']);
    });
    it('returns empty for PAID and ARCHIVE', () => {
      expect(getAllowedNextStatuses('PAID')).toEqual([]);
      expect(getAllowedNextStatuses('ARCHIVE')).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('rejects same status', () => {
      expect(canTransition('NEW', 'NEW')).toBe(false);
    });
    it('allows NEW -> FIRST_LESSON', () => {
      expect(canTransition('NEW', 'FIRST_LESSON')).toBe(true);
    });
    it('allows NEW -> ARCHIVE', () => {
      expect(canTransition('NEW', 'ARCHIVE')).toBe(true);
    });
    it('rejects NEW -> PAID', () => {
      expect(canTransition('NEW', 'PAID')).toBe(false);
    });
    it('allows FIRST_LESSON -> ARCHIVE', () => {
      expect(canTransition('FIRST_LESSON', 'ARCHIVE')).toBe(true);
    });
    it('rejects FIRST_LESSON -> PAID without teacher approve', () => {
      expect(canTransition('FIRST_LESSON', 'PAID')).toBe(false);
      expect(canTransition('FIRST_LESSON', 'PAID', { isTeacherApprove: false })).toBe(false);
    });
    it('allows FIRST_LESSON -> PAID with teacher approve', () => {
      expect(canTransition('FIRST_LESSON', 'PAID', { isTeacherApprove: true })).toBe(true);
    });
    it('rejects PAID -> any', () => {
      expect(canTransition('PAID', 'ARCHIVE')).toBe(false);
    });
    it('rejects ARCHIVE -> any', () => {
      expect(canTransition('ARCHIVE', 'NEW')).toBe(false);
    });
  });

  describe('requireFieldsForTransition', () => {
    it('returns required fields for NEW -> FIRST_LESSON', () => {
      const required = requireFieldsForTransition('NEW', 'FIRST_LESSON');
      expect(required).toContain('firstName');
      expect(required).toContain('lastName');
      expect(required).toContain('phone');
      expect(required).toContain('age');
      expect(required).toContain('levelId');
      expect(required).toContain('teacherId');
      expect(required).toContain('groupId');
      expect(required).toContain('centerId');
      expect(required).toHaveLength(8);
    });
    it('returns empty for other transitions', () => {
      expect(requireFieldsForTransition('FIRST_LESSON', 'ARCHIVE')).toEqual([]);
      expect(requireFieldsForTransition('WAITLIST', 'FIRST_LESSON')).toEqual([]);
    });
  });

  describe('CRM_COLUMN_ORDER', () => {
    it('has fixed column order', () => {
      expect(CRM_COLUMN_ORDER).toEqual([
        'NEW',
        'FIRST_LESSON',
        'PAID',
        'WAITLIST',
        'ARCHIVE',
      ]);
    });
  });
});
