export type CreateTeacherFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hourlyRate: number;
  experienceYears?: number;
  videoUrl?: string;
  centerIds?: string[];
};

export type AddTeacherFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
