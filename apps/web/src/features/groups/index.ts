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
  CreateGroupDto,
  UpdateGroupDto,
  GroupStudentItem,
  GroupStudentsResponse,
} from './types';

// Components
export { CreateGroupForm } from './components/CreateGroupForm';
export { EditGroupForm } from './components/EditGroupForm';
export { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
export { GroupCard } from './components/GroupCard';
export { getGroupOccupancyMeta } from './occupancy';
export type { GroupOccupancyMeta, GroupOccupancyStatus } from './occupancy';