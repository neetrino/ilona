import type { UserStatus } from '@/types';

const ADMIN_TEXTAREA_CLASS = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[5.5rem] resize-none py-2',
);

type UpdateStudentFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  dateOfBirth?: string;
  firstLessonDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  groupId?: string;
  teacherId?: string;
  centerId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassportInfo?: string;
  monthlyFee: number;
  notes?: string;
  registerDate?: string;
};

interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}
