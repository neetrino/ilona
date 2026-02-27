import { describe, it, expect } from 'vitest';
import {
  getAllowedNextStatuses,
  canTransition,
  requireFieldsForTransition,
  CRM_COLUMN_ORDER,
} from './crm-status.machine';

describe('CrmStatusMachine', () => {
  describe('getAllowedNextStatuses', () => {
    it('returns AGREED and ARCHIVE for NEW', () => {
      expect(getAllowedNextStatuses('NEW')).toEqual(['AGREED', 'ARCHIVE']);
    });
    it('returns FIRST_LESSON, PAID, WAITLIST, ARCHIVE for AGREED', () => {
      expect(getAllowedNextStatuses('AGREED')).toEqual([
        'FIRST_LESSON',
        'PAID',
        'WAITLIST',
        'ARCHIVE',
      ]);
    });
    it('returns PROCESSING and ARCHIVE for FIRST_LESSON', () => {
      expect(getAllowedNextStatuses('FIRST_LESSON')).toEqual(['PROCESSING', 'ARCHIVE']);
    });
    it('returns PAID and ARCHIVE for PROCESSING', () => {
      expect(getAllowedNextStatuses('PROCESSING')).toEqual(['PAID', 'ARCHIVE']);
    });
    it('returns AGREED and ARCHIVE for WAITLIST', () => {
      expect(getAllowedNextStatuses('WAITLIST')).toEqual(['AGREED', 'ARCHIVE']);
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
    it('allows NEW -> AGREED', () => {
      expect(canTransition('NEW', 'AGREED')).toBe(true);
    });
    it('allows NEW -> ARCHIVE', () => {
      expect(canTransition('NEW', 'ARCHIVE')).toBe(true);
    });
    it('rejects NEW -> PAID', () => {
      expect(canTransition('NEW', 'PAID')).toBe(false);
    });
    it('allows AGREED -> FIRST_LESSON', () => {
      expect(canTransition('AGREED', 'FIRST_LESSON')).toBe(true);
    });
    it('allows FIRST_LESSON -> ARCHIVE', () => {
      expect(canTransition('FIRST_LESSON', 'ARCHIVE')).toBe(true);
    });
    it('rejects FIRST_LESSON -> PROCESSING without teacher approve', () => {
      expect(canTransition('FIRST_LESSON', 'PROCESSING')).toBe(false);
      expect(canTransition('FIRST_LESSON', 'PROCESSING', { isTeacherApprove: false })).toBe(false);
    });
    it('allows FIRST_LESSON -> PROCESSING with teacher approve', () => {
      expect(canTransition('FIRST_LESSON', 'PROCESSING', { isTeacherApprove: true })).toBe(true);
    });
    it('allows PROCESSING -> PAID', () => {
      expect(canTransition('PROCESSING', 'PAID')).toBe(true);
    });
    it('rejects PAID -> any', () => {
      expect(canTransition('PAID', 'ARCHIVE')).toBe(false);
      expect(canTransition('PAID', 'PROCESSING')).toBe(false);
    });
    it('rejects ARCHIVE -> any', () => {
      expect(canTransition('ARCHIVE', 'NEW')).toBe(false);
      expect(canTransition('ARCHIVE', 'AGREED')).toBe(false);
    });
  });

  describe('requireFieldsForTransition', () => {
    it('returns required fields for NEW -> AGREED', () => {
      const required = requireFieldsForTransition('NEW', 'AGREED');
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
      expect(requireFieldsForTransition('AGREED', 'FIRST_LESSON')).toEqual([]);
      expect(requireFieldsForTransition('PROCESSING', 'PAID')).toEqual([]);
    });
  });

  describe('CRM_COLUMN_ORDER', () => {
    it('has fixed column order', () => {
      expect(CRM_COLUMN_ORDER).toEqual([
        'NEW',
        'AGREED',
        'FIRST_LESSON',
        'PROCESSING',
        'PAID',
        'WAITLIST',
        'ARCHIVE',
      ]);
    });
  });
});
