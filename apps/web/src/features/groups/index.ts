// Hooks
export {
  useGroups,
  useGroup,
  useGroupStudents,
  useMyGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useToggleGroupActive,
  useAssignTeacher,
  useAddStudentToGroup,
  useRemoveStudentFromGroup,
  groupKeys,
} from './hooks';

// Types
export type {
  Group,
  GroupsResponse,
  GroupFilters,
  GroupScheduleEntry,
  GroupTeacherRef,
  CreateGroupDto,
  UpdateGroupDto,
  GroupStudentItem,
  GroupStudentsResponse,
} from './types';

// Components
export { CreateGroupForm } from './components/CreateGroupForm';
export { EditGroupForm } from './components/EditGroupForm';
export { GroupIconPicker } from './components/GroupIconPicker';
export { GroupIconDisplay, getGroupIconComponent } from './group-icon-registry';
export { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
export {
  GroupStatusConfirmationDialog,
} from './components/GroupStatusConfirmationDialog';
export type { GroupStatusDialogAction } from './components/GroupStatusConfirmationDialog';
export { GroupCard } from './components/GroupCard';
export { GroupScheduleEditor } from './components/GroupScheduleEditor';
export { getGroupOccupancyMeta } from './occupancy';
export type { GroupOccupancyMeta, GroupOccupancyStatus } from './occupancy';