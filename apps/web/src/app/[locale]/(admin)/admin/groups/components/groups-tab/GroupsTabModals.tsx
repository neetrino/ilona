'use client';

import {
  CreateGroupForm,
  EditGroupForm,
  DeleteConfirmationDialog,
  GroupStatusConfirmationDialog,
  type Group,
} from '@/features/groups';
import { GroupStudentsModal } from '../GroupStudentsModal';
import { StudentDetailsModal } from '../StudentDetailsModal';
import type { GroupsTabState } from './useGroupsTab';

interface GroupsTabModalsProps {
  isAddGroupOpen: boolean;
  onCreateGroupOpenChange: (open: boolean) => void;
  editGroupId: string | null;
  onEditGroupOpenChange: (open: boolean) => void;
  groups: Group[];
  onToggleActiveFromEdit: () => void;
  onDeleteFromEdit?: () => void;
  isStatusTogglePending: boolean;
  statusDialog: { groupId: string; wasActive: boolean } | null;
  onStatusDialogOpenChange: (open: boolean) => void;
  onConfirmGroupStatus: (reason?: string) => void;
  statusTogglePending: boolean;
  statusDialogError: string | null;
  requireDeactivationReason?: boolean;
  deleteGroupId: string | null;
  onDeleteGroupIdChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  deleteGroupName: string | undefined;
  deletePending: boolean;
  deleteError: string | null | undefined;
  isBulkDeleteDialogOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onBulkDeleteConfirm: () => void;
  bulkDeleteItemName: string | undefined;
  bulkDeleteError: string | null;
  bulkDeleteSuccess: boolean;
  deletedCount: number;
  studentsGroupId: string | null;
  studentsModalGroupName: string;
  onStudentsModalOpenChange: (open: boolean) => void;
  onStudentSelect: (studentId: string) => void;
  selectedStudentId: string | null;
  onStudentDetailsOpenChange: (open: boolean) => void;
  t: GroupsTabState['t'];
}

export function GroupsTabModals({
  isAddGroupOpen,
  onCreateGroupOpenChange,
  editGroupId,
  onEditGroupOpenChange,
  groups,
  onToggleActiveFromEdit,
  onDeleteFromEdit,
  isStatusTogglePending,
  statusDialog,
  onStatusDialogOpenChange,
  onConfirmGroupStatus,
  statusTogglePending,
  statusDialogError,
  requireDeactivationReason = false,
  deleteGroupId,
  onDeleteGroupIdChange,
  onDeleteConfirm,
  deleteGroupName,
  deletePending,
  deleteError,
  isBulkDeleteDialogOpen,
  onBulkDeleteOpenChange,
  onBulkDeleteConfirm,
  bulkDeleteItemName,
  bulkDeleteError,
  bulkDeleteSuccess,
  deletedCount,
  studentsGroupId,
  studentsModalGroupName,
  onStudentsModalOpenChange,
  onStudentSelect,
  selectedStudentId,
  onStudentDetailsOpenChange,
  t,
}: GroupsTabModalsProps) {
  return (
    <>
      <CreateGroupForm open={isAddGroupOpen} onOpenChange={onCreateGroupOpenChange} />

      {editGroupId && (
        <EditGroupForm
          open={!!editGroupId}
          onOpenChange={onEditGroupOpenChange}
          groupId={editGroupId}
          onToggleActive={onToggleActiveFromEdit}
          onDelete={onDeleteFromEdit}
          isStatusTogglePending={isStatusTogglePending}
        />
      )}

      <GroupStatusConfirmationDialog
        open={!!statusDialog}
        onOpenChange={onStatusDialogOpenChange}
        onConfirm={onConfirmGroupStatus}
        action={statusDialog ? (statusDialog.wasActive ? 'deactivate' : 'activate') : 'activate'}
        groupName={
          statusDialog ? groups.find((g) => g.id === statusDialog.groupId)?.name : undefined
        }
        isLoading={statusTogglePending}
        error={statusDialogError ?? undefined}
        requireReason={requireDeactivationReason}
      />

      <DeleteConfirmationDialog
        open={!!deleteGroupId}
        onOpenChange={(open) => onDeleteGroupIdChange(open)}
        onConfirm={onDeleteConfirm}
        itemName={deleteGroupName}
        isLoading={deletePending}
        error={deleteError || undefined}
        itemType="group"
      />

      <DeleteConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={onBulkDeleteOpenChange}
        onConfirm={onBulkDeleteConfirm}
        itemName={bulkDeleteItemName}
        isLoading={deletePending}
        error={bulkDeleteError || undefined}
        itemType="group"
        title={t('deleteGroupsTitle')}
      />

      <GroupStudentsModal
        open={!!studentsGroupId}
        onOpenChange={onStudentsModalOpenChange}
        groupId={studentsGroupId}
        groupName={studentsModalGroupName}
        onStudentSelect={onStudentSelect}
      />

      <StudentDetailsModal
        open={!!selectedStudentId}
        onOpenChange={onStudentDetailsOpenChange}
        studentId={selectedStudentId}
      />

      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0
              ? t('groupDeletedCount', { count: deletedCount })
              : t('groupsDeletedSuccess')}
          </p>
        </div>
      )}
    </>
  );
}
