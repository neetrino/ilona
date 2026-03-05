import { CrmLeadStatus } from '@ilona/database';

/** Supported CRM lead statuses */
const TRANSITIONS: Partial<Record<CrmLeadStatus, CrmLeadStatus[]>> = {
  NEW: ['FIRST_LESSON', 'ARCHIVE'],
  FIRST_LESSON: ['PAID', 'ARCHIVE'], // PAID only via teacher approve
  WAITLIST: ['FIRST_LESSON', 'ARCHIVE'],
  PAID: [],
  ARCHIVE: [],
};

export const CRM_COLUMN_ORDER: CrmLeadStatus[] = [
  'NEW',
  'FIRST_LESSON',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

export function getAllowedNextStatuses(from: CrmLeadStatus): CrmLeadStatus[] {
  return [...(TRANSITIONS[from] ?? [])];
}

export function canTransition(
  from: CrmLeadStatus,
  to: CrmLeadStatus,
  options?: { isTeacherApprove?: boolean }
): boolean {
  if (from === to) return false;
  const allowed = TRANSITIONS[from];
  if (!allowed?.includes(to)) return false;
  // FIRST_LESSON -> PAID is only allowed via teacher approve
  if (from === 'FIRST_LESSON' && to === 'PAID') {
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
  // NEW -> FIRST_LESSON: require firstName, lastName, phone, age, level, teacher, group, center
  if (from === 'NEW' && to === 'FIRST_LESSON') {
    return ['firstName', 'lastName', 'phone', 'age', 'levelId', 'teacherId', 'groupId', 'centerId'];
  }
  return [];
}
