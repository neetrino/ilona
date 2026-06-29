import type { CrmLeadStatus, UpdateLeadDto } from '@/features/crm/types';

export interface CenterOption {
  id: string;
  name: string;
}

export interface TeacherOption {
  id: string;
  user?: { firstName?: string; lastName?: string };
}

export interface GroupOption {
  id: string;
  name: string;
  teacherId?: string | null;
}

export interface EditLeadModalProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  onSaved: () => void;
  centers: CenterOption[];
  teachers: TeacherOption[];
  groups: GroupOption[];
  /** All CRM statuses to show in the status selector (must match board columns). Defaults to CRM_COLUMN_ORDER. */
  availableStatuses?: CrmLeadStatus[];
  canDeleteLead?: boolean;
  onDeleteRequest?: () => void;
  deleteDisabled?: boolean;
}

export type EditLeadFormState = UpdateLeadDto & {
  status?: CrmLeadStatus;
  archivedReason?: string;
  parentSurname?: string;
};

export interface SelectOption {
  id: string;
  label: string;
}
