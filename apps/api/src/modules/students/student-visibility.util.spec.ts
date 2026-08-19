import { describe, expect, it } from 'vitest';
import { UserRole } from '@ilona/database';
import {
  canViewStudentPassport,
  omitStudentPassportForTeacher,
} from './student-visibility.util';

describe('student-visibility.util', () => {
  const student = {
    id: 'stu-1',
    parentPhone: '+37411111111',
    parentPassportInfo: 'AA1234567',
  };

  it('allows passport for admin and manager only', () => {
    expect(canViewStudentPassport(UserRole.ADMIN)).toBe(true);
    expect(canViewStudentPassport(UserRole.MANAGER)).toBe(true);
    expect(canViewStudentPassport(UserRole.TEACHER)).toBe(false);
    expect(canViewStudentPassport(UserRole.STUDENT)).toBe(false);
  });

  it('strips passport from teacher responses and keeps contact fields', () => {
    const result = omitStudentPassportForTeacher(student, UserRole.TEACHER);
    expect(result).toEqual({ id: 'stu-1', parentPhone: '+37411111111' });
    expect('parentPassportInfo' in result).toBe(false);
  });

  it('keeps passport for manager and admin', () => {
    expect(omitStudentPassportForTeacher(student, UserRole.MANAGER)).toEqual(student);
    expect(omitStudentPassportForTeacher(student, UserRole.ADMIN)).toEqual(student);
  });
});
