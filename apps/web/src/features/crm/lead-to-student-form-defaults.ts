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
  const dobStr = (p.dateOfBirth ?? lead.dateOfBirth)?.slice(0, 10) ?? '';
  const leadAge = lead.age;
  const manualAgeFromLead =
    leadAge != null && leadAge >= 1 && leadAge <= 120 && dobStr === '' ? leadAge : undefined;

  return {
    email: '',
    password: '',
    firstName: (p.firstName ?? lead.firstName) ?? '',
    lastName: (p.lastName ?? lead.lastName) ?? '',
    phone: phoneDigits,
    dateOfBirth: dobStr,
    firstLessonDate: (p.firstLessonDate ?? lead.firstLessonDate)?.slice(0, 10) ?? '',
    manualAge: manualAgeFromLead,
    levelId: (p.levelId ?? lead.levelId) ?? '',
    groupId: (p.groupId ?? lead.groupId) ?? '',
    teacherId: (p.teacherId ?? lead.teacherId) ?? '',
    centerId: (p.centerId ?? lead.centerId) ?? '',
    parentName: (p.parentName ?? lead.parentName) ?? '',
    parentSurname: '',
    parentPhone: parentPhoneDigits,
    parentEmail: (p.parentEmail ?? lead.parentEmail) ?? '',
    parentPassportInfo: (p.parentPassportInfo ?? lead.parentPassportInfo) ?? '',
    monthlyFee: 0,
    notes: notesFromLead,
    receiveReports: true,
  };
}
