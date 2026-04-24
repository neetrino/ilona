// Hooks
export {
  useStudents,
  useStudent,
  useStudentStatistics,
  useCreateStudent,
  useUpdateStudent,
  useChangeStudentGroup,
  useDeleteStudent,
  useDeleteStudentsBulk,
  useMyProfile,
  useMyDashboard,
  useMyAssignedStudents,
  studentKeys,
} from './hooks';

export {
  createStudentSchema,
  computeAgeFromDob,
  ISO_DATE_RE,
  type CreateStudentFormData,
} from './student-account-form.schema';
export { formDataToCreateStudentDto } from './student-account-form.payload';
export { StudentAccountFormFields } from './components/StudentAccountFormFields';

// Components
export { AddStudentForm } from './components/AddStudentForm';
export { EditStudentForm } from './components/EditStudentForm';
export { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
export { InlineSelect } from './components/InlineSelect';

// Types
export type {
  Student,
  StudentGroup,
  OnboardingStudentItem,
  TeacherAssignedItem,
  StudentsResponse,
  StudentFilters,
  CreateStudentDto,
  UpdateStudentDto,
  StudentStatistics,
  StudentDashboard,
  StudentUpcomingLesson,
  StudentFeedback,
  StudentPayment,
  StudentLifecycleStatus,
  StudentRiskLabel,
} from './types';
export { isOnboardingItem, getItemId } from './types';
