// Hooks
export {
  useTeachers,
  useTeacher,
  useTeacherStatistics,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useDeleteTeachers,
  teacherKeys,
} from './hooks';

// Components
export { AddTeacherForm } from './components/AddTeacherForm';
export { EditTeacherForm } from './components/EditTeacherForm';
export { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
export { TeacherDetailsDrawer } from './components/TeacherDetailsDrawer';
export { ObligationDetailsModal } from './components/ObligationDetailsModal';

// Types
export type {
  Teacher,
  TeacherGroup,
  TeachersResponse,
  TeacherFilters,
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherStatistics,
} from './types';
