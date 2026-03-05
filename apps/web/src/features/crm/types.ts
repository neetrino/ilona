export type CrmLeadStatus =
  | 'NEW'
  | 'FIRST_LESSON'
  | 'PAID'
  | 'WAITLIST'
  | 'ARCHIVE';

export const CRM_COLUMN_ORDER: CrmLeadStatus[] = [
  'NEW',
  'FIRST_LESSON',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

export interface CrmLeadAttachment {
  id: string;
  leadId: string;
  type: 'VOICE_RECORDING' | 'FILE';
  r2Key: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export interface CrmLeadActivity {
  id: string;
  leadId: string;
  actorUserId: string | null;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  /** Present when lead is loaded by detail endpoint (Admin) for display. */
  actorUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CrmLead {
  id: string;
  status: CrmLeadStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  assignedManagerId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  age: number | null;
  levelId: string | null;
  teacherId: string | null;
  groupId: string | null;
  centerId: string | null;
  transferFlag: boolean;
  transferComment: string | null;
  teacherApprovedAt: string | null;
  archivedReason: string | null;
  source: string | null;
  notes: string | null;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  } | null;
  group?: {
    id: string;
    name: string;
    level: string | null;
    center: { id: string; name: string };
  } | null;
  center?: { id: string; name: string } | null;
  attachments?: CrmLeadAttachment[];
  activities?: CrmLeadActivity[];
  student?: { id: string } | null;
}

export interface CrmLeadsResponse {
  items: CrmLead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  countsByStatus?: Partial<Record<CrmLeadStatus, number>>;
}

export interface CrmLeadFilters {
  skip?: number;
  take?: number;
  search?: string;
  status?: CrmLeadStatus;
  centerId?: string;
  teacherId?: string;
  groupId?: string;
  levelId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: number;
  levelId?: string;
  teacherId?: string;
  groupId?: string;
  centerId?: string;
  source?: string;
  notes?: string;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  assignedManagerId?: string;
  transferFlag?: boolean;
  transferComment?: string;
  archivedReason?: string;
}

export interface ChangeStatusDto {
  status: CrmLeadStatus;
  archivedReason?: string;
}
