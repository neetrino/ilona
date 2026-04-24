import type { CreateStudentFormData } from '@/features/students/student-account-form.schema';
import type { CrmLead, UpdateLeadDto } from './types';

/** Map CRM lead (+ optional edit-modal snapshot) to Add-Student form default values. */
export function leadToCreateStudentFormDefaults(
  lead: CrmLead,
  prefill?: Partial<UpdateLeadDto>,
): Partial<CreateStudentFormData> {
  const p = prefill ?? {};
  const phoneDigits = (p.phone ?? lead.phone ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (p.parentPhone ?? lead.parentPhone ?? '').replace(/\D/g, '');
  const rawNotes = p.notes ?? lead.notes ?? p.comment ?? lead.comment;
  const notesFromLead = rawNotes != null && rawNotes !== '' ? String(rawNotes) : '';

  return {
    email: '',
    password: '',
    firstName: (p.firstName ?? lead.firstName) ?? '',
    lastName: (p.lastName ?? lead.lastName) ?? '',
    phone: phoneDigits,
    dateOfBirth: (p.dateOfBirth ?? lead.dateOfBirth)?.slice(0, 10) ?? '',
    firstLessonDate: (p.firstLessonDate ?? lead.firstLessonDate)?.slice(0, 10) ?? '',
    age: undefined,
    groupId: (p.groupId ?? lead.groupId) ?? '',
    teacherId: (p.teacherId ?? lead.teacherId) ?? '',
    parentName: (p.parentName ?? lead.parentName) ?? '',
    parentPhone: parentPhoneDigits,
    parentEmail: '',
    parentPassportInfo: (p.parentPassportInfo ?? lead.parentPassportInfo) ?? '',
    monthlyFee: 0,
    notes: notesFromLead,
    receiveReports: true,
  };
}
