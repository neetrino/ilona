import { CrmLeadStatus } from '@prisma/client';

/**
 * Allowed status transitions (state machine).
 * - NEW -> AGREED | ARCHIVE
 * - AGREED -> FIRST_LESSON | PAID | WAITLIST | ARCHIVE
 * - FIRST_LESSON -> (only via Teacher Approved) PROCESSING | ARCHIVE
 * - PROCESSING -> PAID | ARCHIVE
 * - WAITLIST -> AGREED | ARCHIVE
 * - PAID -> no backward transitions
 * - ARCHIVE -> no restore
 */
const ALLOWED_TRANSITIONS: Record<CrmLeadStatus, CrmLeadStatus[]> = {
  NEW: ['AGREED', 'ARCHIVE'],
  AGREED: ['FIRST_LESSON', 'PAID', 'WAITLIST', 'ARCHIVE'],
  FIRST_LESSON: ['PROCESSING', 'ARCHIVE'], // PROCESSING only via teacher approve
  PROCESSING: ['PAID', 'ARCHIVE'],
  WAITLIST: ['AGREED', 'ARCHIVE'],
  PAID: [],
  ARCHIVE: [],
};

export const CRM_COLUMN_ORDER: CrmLeadStatus[] = [
  'NEW',
  'AGREED',
  'FIRST_LESSON',
  'PROCESSING',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

export function getAllowedNextStatuses(from: CrmLeadStatus): CrmLeadStatus[] {
  return [...ALLOWED_TRANSITIONS[from]];
}

export function canTransition(
  from: CrmLeadStatus,
  to: CrmLeadStatus,
  options?: { isTeacherApprove?: boolean }
): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) return false;
  // FIRST_LESSON -> PROCESSING is only allowed via teacher approve
  if (from === 'FIRST_LESSON' && to === 'PROCESSING') {
    return options?.isTeacherApprove === true;
  }
  return true;
}

export function requireFieldsForTransition(
  from: CrmLeadStatus,
  to: CrmLeadStatus
): (keyof {
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  levelId: string;
  teacherId: string;
  groupId: string;
  centerId: string;
})[] {
  // NEW -> AGREED: require firstName, lastName, phone, age, level, teacher, group, center
  if (from === 'NEW' && to === 'AGREED') {
    return ['firstName', 'lastName', 'phone', 'age', 'levelId', 'teacherId', 'groupId', 'centerId'];
  }
  return [];
}
