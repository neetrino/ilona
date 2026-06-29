export interface CreateGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type CreateGroupFormData = {
  name: string;
  level?: string;
  description?: string;
  centerId: string;
  teacherId: string;
  secondTeacherId: string;
};
