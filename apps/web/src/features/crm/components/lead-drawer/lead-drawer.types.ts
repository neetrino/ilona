import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from 'react';
import type { CrmLead } from '@/features/crm/types';

export interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export interface LeadDrawerDropdownOption {
  id: string;
  label: string;
}

export interface LeadDrawerViewModel {
  leadId: string | null;
  lead: CrmLead | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  form: Partial<CrmLead>;
  comment: string;
  submittingComment: boolean;
  selectedTeacherId: string;
  levelOptions: LeadDrawerDropdownOption[];
  centerOptions: LeadDrawerDropdownOption[];
  teacherOptions: LeadDrawerDropdownOption[];
  groupOptions: LeadDrawerDropdownOption[];
  contentStyle: CSSProperties;
  isBaseLayer: boolean;
  setComment: (value: string) => void;
  setForm: Dispatch<SetStateAction<Partial<CrmLead>>>;
  patchAndSave: (patch: Partial<CrmLead>) => Promise<void>;
  handleSaveFields: () => Promise<void>;
  handleAddComment: (e: FormEvent) => Promise<void>;
  refetch: () => Promise<unknown>;
  onClose: () => void;
  onUpdated: () => void;
}
