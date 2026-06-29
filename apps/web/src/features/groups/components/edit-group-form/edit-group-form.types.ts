export type UpdateGroupFormData = {
  name?: string;
  level?: string;
  description?: string;
  centerId?: string;
  teacherId?: string;
  secondTeacherId?: string;
};

export interface EditGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onToggleActive?: () => void;
  onDelete?: () => void;
  isStatusTogglePending?: boolean;
}
