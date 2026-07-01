import { describe, it, expect } from 'vitest';
import { isLessonAbsenceChecklistComplete } from './attendance-absence-completion.util';

describe('isLessonAbsenceChecklistComplete', () => {
  it('returns false when the group has no students', () => {
    expect(isLessonAbsenceChecklistComplete([], ['student-1'])).toBe(false);
  });

  it('returns false when only some students have saved attendance', () => {
    const groupStudentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const attendanceStudentIds = ['s1'];

    expect(isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)).toBe(false);
  });

  it('returns false when seven of eight students have saved attendance', () => {
    const groupStudentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const attendanceStudentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];

    expect(isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)).toBe(false);
  });

  it('returns true when every group student has saved attendance', () => {
    const groupStudentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const attendanceStudentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

    expect(isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)).toBe(true);
  });

  it('returns false when attendance exists only for students outside the group', () => {
    const groupStudentIds = ['s1', 's2'];
    const attendanceStudentIds = ['s3', 's4'];

    expect(isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)).toBe(false);
  });

  it('returns true when extra attendance records exist for former students', () => {
    const groupStudentIds = ['s1', 's2'];
    const attendanceStudentIds = ['s1', 's2', 'former-student'];

    expect(isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)).toBe(true);
  });
});
