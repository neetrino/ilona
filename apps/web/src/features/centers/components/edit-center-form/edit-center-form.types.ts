export type UpdateCenterFormData = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  colorHex?: string;
  isActive?: boolean;
};

export type EditCenterFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
  onToggleActive?: () => void;
  onDelete?: () => void;
  isStatusTogglePending?: boolean;
};
