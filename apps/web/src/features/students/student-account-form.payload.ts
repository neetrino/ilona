import type { CreateStudentDto } from './types';
import type { CreateStudentFormData } from './student-account-form.schema';

/** Same mapping as Add New Student submit — keep CRM registration in sync. */
export function formDataToCreateStudentDto(
  data: CreateStudentFormData,
  computedAge: number | undefined,
): CreateStudentDto {
  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || undefined,
    dateOfBirth: data.dateOfBirth,
    firstLessonDate: data.firstLessonDate || undefined,
    age: computedAge ?? data.age,
    groupId: data.groupId || undefined,
    teacherId: data.teacherId || undefined,
    parentName: data.parentName || undefined,
    parentPhone: data.parentPhone || undefined,
    parentEmail: data.parentEmail || undefined,
    parentPassportInfo: data.parentPassportInfo || undefined,
    monthlyFee: data.monthlyFee,
    notes: data.notes || undefined,
    receiveReports: data.receiveReports ?? true,
  };
}
