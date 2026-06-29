export type CreateCenterFormData = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  colorHex?: string;
};

export type CreateCenterFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
