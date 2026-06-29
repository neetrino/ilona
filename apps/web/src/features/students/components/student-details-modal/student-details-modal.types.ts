import type { Student } from '../../types';

export interface StudentDetailsModalProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  locale: string;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onDeactivate?: (student: Student) => void;
  onFeedback?: (student: Student) => void;
  actionsDisabled?: boolean;
}
