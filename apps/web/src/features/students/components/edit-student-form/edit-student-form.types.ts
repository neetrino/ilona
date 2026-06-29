export type UpdateStudentFormData = {
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

export interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}
