import type { Teacher } from '@/features/teachers';

export type UpdateTeacherFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hourlyRate?: number;
  experienceYears?: number;
  videoUrl?: string;
  centerIds?: string[];
  workingDays?: string[];
};

export type EditTeacherFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  onDelete?: (teacher: Teacher) => void;
  onDeactivate?: (teacher: Teacher) => void;
};
