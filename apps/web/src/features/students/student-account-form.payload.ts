import type { CreateStudentDto } from './types';
import type { CreateStudentFormData } from './student-account-form.schema';
import { combineParentDisplayName, resolveStudentCreateAge } from './student-account-form.age';
import { resolveDmyOrIsoToIso } from '@/shared/lib/dmy-date';

/** Same mapping as Add New Student submit — keep CRM registration in sync. */
export function formDataToCreateStudentDto(data: CreateStudentFormData): CreateStudentDto {
  const effectiveAge = resolveStudentCreateAge(data);
  const dobIso = resolveDmyOrIsoToIso(data.dateOfBirth?.trim());
  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || undefined,
    dateOfBirth: dobIso,
    firstLessonDate: resolveDmyOrIsoToIso(data.firstLessonDate?.trim()),
    age: effectiveAge,
    groupId: data.groupId || undefined,
    teacherId: data.teacherId || undefined,
    centerId: data.centerId?.trim() ? data.centerId.trim() : undefined,
    parentName: combineParentDisplayName(data.parentName, data.parentSurname),
    parentPhone: data.parentPhone || undefined,
    parentEmail: data.parentEmail || undefined,
    monthlyFee: data.monthlyFee,
    notes: data.notes || undefined,
    receiveReports: data.receiveReports ?? true,
  };
}

export { resolveStudentCreateAge, combineParentDisplayName } from './student-account-form.age';
