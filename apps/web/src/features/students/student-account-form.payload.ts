import type { CreateStudentDto } from './types';
import type { CreateStudentFormData } from './student-account-form.schema';
import { combineParentDisplayName, resolveStudentCreateAge } from './student-account-form.age';

/** Same mapping as Add New Student submit — keep CRM registration in sync. */
export function formDataToCreateStudentDto(data: CreateStudentFormData): CreateStudentDto {
  const effectiveAge = resolveStudentCreateAge(data);
  const dob = data.dateOfBirth?.trim();
  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || undefined,
    dateOfBirth: dob && dob !== '' ? dob : undefined,
    firstLessonDate: data.firstLessonDate || undefined,
    age: effectiveAge,
    groupId: data.groupId || undefined,
    teacherId: data.teacherId || undefined,
    centerId: data.centerId?.trim() ? data.centerId.trim() : undefined,
    parentName: combineParentDisplayName(data.parentName, data.parentSurname),
    parentPhone: data.parentPhone || undefined,
    parentEmail: data.parentEmail || undefined,
    parentPassportInfo: data.parentPassportInfo || undefined,
    monthlyFee: data.monthlyFee,
    notes: data.notes || undefined,
    receiveReports: data.receiveReports ?? true,
  };
}

export { resolveStudentCreateAge, combineParentDisplayName } from './student-account-form.age';
