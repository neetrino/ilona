import type { CrmLead } from '@/features/crm/types';

export const VOICE_LEAD_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type VoiceLeadFormState = Partial<
  Pick<
    CrmLead,
    'firstName' | 'lastName' | 'phone' | 'age' | 'levelId' | 'teacherId' | 'groupId' | 'centerId'
  >
>;

export type CenterOption = {
  id: string;
  name: string;
};

export type TeacherOption = {
  id: string;
  user?: { firstName?: string; lastName?: string };
};

export type GroupOption = {
  id: string;
  name: string;
  teacherId?: string | null;
};

export type VoiceLeadDetailModalProps = {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  centers?: CenterOption[];
  teachers?: TeacherOption[];
  groups?: GroupOption[];
};
