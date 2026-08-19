import { UserRole } from '@ilona/database';

/** Passport/ID is manager (and admin) operational data — never returned to teachers. */
export function canViewStudentPassport(role?: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
}

export function omitStudentPassportForTeacher<T extends { parentPassportInfo?: unknown }>(
  record: T,
  role?: UserRole,
): T | Omit<T, 'parentPassportInfo'> {
  if (role !== UserRole.TEACHER) {
    return record;
  }
  const { parentPassportInfo: _omitted, ...rest } = record;
  return rest;
}
