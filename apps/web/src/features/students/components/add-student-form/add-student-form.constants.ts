import { DEFAULT_GROUP_LEVEL } from '@/features/groups/lib/group-level-options';

export function getAddStudentFormDefaultValues(centerId = '') {
  return {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    firstLessonDate: '',
    manualAge: undefined,
    levelId: DEFAULT_GROUP_LEVEL,
    groupId: '',
    teacherId: '',
    centerId,
    parentName: '',
    parentSurname: '',
    parentPhone: '',
    parentEmail: '',
    parentPassportInfo: '',
    monthlyFee: undefined,
    notes: '',
    receiveReports: true,
  };
}
