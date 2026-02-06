// Hooks
export {
  useGroups,
  useGroup,
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
} from './types';

// Components
export { CreateGroupForm } from './components/CreateGroupForm';
export { EditGroupForm } from './components/EditGroupForm';
export { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';