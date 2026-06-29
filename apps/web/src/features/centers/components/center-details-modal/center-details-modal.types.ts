export type CenterDetailsTabId = 'teachers' | 'students' | 'groups' | 'schedule' | 'info';

export type CenterDetailsModalProps = {
  centerId: string | null;
  open: boolean;
  onClose: () => void;
};
