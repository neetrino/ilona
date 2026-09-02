import type { Student } from '../../types';
import type { StudentDetailsAudience } from './student-details-modal.visibility';

export interface StudentDetailsModalProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  locale: string;
  /** Teachers see contact/enrollment only — no fees or payments. */
  audience?: StudentDetailsAudience;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onDeactivate?: (student: Student) => void;
  onFeedback?: (student: Student) => void;
  actionsDisabled?: boolean;
}
