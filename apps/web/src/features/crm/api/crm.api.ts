import { api } from '@/shared/lib/api';
import { getApiBaseUrl } from '@/shared/lib/api-config';
import type {
  CrmLead,
  CrmLeadsResponse,
  CrmLeadFilters,
  CreateLeadDto,
  UpdateLeadDto,
  ChangeStatusDto,
  ChangeBranchDto,
  CrmLeadActivity,
  CrmLeadStatus,
  RegisterPaidLeadPayload,
} from '../types';

const CRM_LEADS_ENDPOINT = '/crm/leads';

export async function fetchLeads(filters?: CrmLeadFilters): Promise<CrmLeadsResponse> {
  const params = new URLSearchParams();
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.centerId) params.append('centerId', filters.centerId);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.levelId) params.append('levelId', filters.levelId);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  const query = params.toString();
  const url = query ? `${CRM_LEADS_ENDPOINT}?${query}` : CRM_LEADS_ENDPOINT;
  return api.get<CrmLeadsResponse>(url);
}

export async function fetchLead(id: string): Promise<CrmLead> {
  return api.get<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}`);
}

export async function createLead(data: CreateLeadDto): Promise<CrmLead> {
  return api.post<CrmLead>(CRM_LEADS_ENDPOINT, data);
}

/** Create a new lead from a voice recording (audio file). Lead appears in NEW column. */
export async function createLeadFromVoice(
  file: File | Blob,
  fileName: string,
  centerId?: string,
): Promise<CrmLead> {
  const form = new FormData();
  form.append('file', file, fileName);
  if (centerId) form.append('centerId', centerId);
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/voice`, form);
}

/** Sanitize payload for PATCH: API expects UUIDs or omit, and age as number. Empty strings fail validation. */
function sanitizeUpdateLeadPayload(data: UpdateLeadDto): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const uuidFields = ['teacherId', 'groupId', 'centerId', 'assignedManagerId'] as const;
  for (const key of uuidFields) {
    const v = data[key];
    if (v !== undefined && v !== null && v !== '') out[key] = v;
  }
  const strFields = [
    'firstName',
    'lastName',
    'phone',
    'levelId',
    'source',
    'notes',
    'transferComment',
    'archivedReason',
    'parentName',
    'parentPhone',
    'parentPassportInfo',
    'comment',
  ] as const;
  for (const key of strFields) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  const dateFields = ['dateOfBirth', 'firstLessonDate'] as const;
  for (const key of dateFields) {
    const v = data[key];
    if (v !== undefined && v !== null && v !== '') out[key] = v;
  }
  if (data.age !== undefined && data.age !== null) {
    const n = typeof data.age === 'number' ? data.age : Number(data.age);
    if (!Number.isNaN(n) && n >= 0) out.age = n;
  }
  if (data.transferFlag !== undefined) out.transferFlag = data.transferFlag;
  return out;
}

export async function updateLead(id: string, data: UpdateLeadDto): Promise<CrmLead> {
  const body = sanitizeUpdateLeadPayload(data);
  return api.patch<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}`, body);
}

export async function deleteLead(id: string): Promise<void> {
  return api.delete<void>(`${CRM_LEADS_ENDPOINT}/${id}`);
}

export async function changeLeadStatus(
  id: string,
  data: ChangeStatusDto
): Promise<CrmLead> {
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}/status`, data);
}

function normalizeRegisterPaidBody(data: RegisterPaidLeadPayload): Record<string, unknown> {
  const phone = data.phone.replace(/\D/g, '');
  const out: Record<string, unknown> = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone,
    age: data.age,
    levelId: data.levelId,
    teacherId: data.teacherId,
    groupId: data.groupId,
    centerId: data.centerId,
  };
  if (data.dateOfBirth) out.dateOfBirth = data.dateOfBirth;
  if (data.firstLessonDate) out.firstLessonDate = data.firstLessonDate;
  if (data.parentName !== undefined) out.parentName = data.parentName.trim() || undefined;
  if (data.parentPhone != null && data.parentPhone.trim() !== '') {
    out.parentPhone = data.parentPhone.replace(/\D/g, '');
  }
  if (data.parentPassportInfo !== undefined) {
    out.parentPassportInfo = data.parentPassportInfo.trim() || undefined;
  }
  if (data.comment !== undefined) out.comment = data.comment.trim() || undefined;
  return out;
}

export async function registerPaidLead(
  id: string,
  data: RegisterPaidLeadPayload
): Promise<CrmLead> {
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}/register-paid`, normalizeRegisterPaidBody(data));
}

export async function changeLeadBranch(
  id: string,
  data: ChangeBranchDto
): Promise<CrmLead> {
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}/branch`, data);
}

export async function fetchLeadActivities(leadId: string): Promise<CrmLeadActivity[]> {
  return api.get<CrmLeadActivity[]>(`${CRM_LEADS_ENDPOINT}/${leadId}/activities`);
}

export async function addLeadComment(
  leadId: string,
  content: string
): Promise<CrmLeadActivity[]> {
  return api.post<CrmLeadActivity[]>(`${CRM_LEADS_ENDPOINT}/${leadId}/comments`, {
    content,
  });
}

export async function getPresignedRecordingUrl(
  leadId: string,
  fileName: string,
  mimeType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  return api.post<{ uploadUrl: string; key: string; publicUrl: string }>(
    `${CRM_LEADS_ENDPOINT}/${leadId}/recordings/presign`,
    { fileName, mimeType }
  );
}

export async function confirmRecording(
  leadId: string,
  key: string,
  mimeType: string,
  size?: number
): Promise<CrmLead> {
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/${leadId}/recordings/confirm`, {
    key,
    mimeType,
    size,
  });
}

export async function getAllowedTransitions(
  status: CrmLeadStatus
): Promise<CrmLeadStatus[]> {
  return api.get<CrmLeadStatus[]>(
    `${CRM_LEADS_ENDPOINT}/allowed-transitions/${status}`
  );
}

/** All CRM statuses in display order (for Admin manual status control). */
export async function fetchCrmStatuses(): Promise<CrmLeadStatus[]> {
  return api.get<CrmLeadStatus[]>(`${CRM_LEADS_ENDPOINT}/statuses`);
}

/** Resolve playable URL for an attachment (R2 key). Use API proxy or public URL. */
export function getRecordingPlayUrl(r2Key: string): string {
  const base = getApiBaseUrl();
  return `${base}/storage/file/${encodeURIComponent(r2Key)}`;
}

// --- Teacher CRM APIs ---
const TEACHER_LEADS_ENDPOINT = '/teacher/leads';

export async function fetchTeacherLeads(groupId?: string): Promise<{ items: CrmLead[]; total: number }> {
  const params = new URLSearchParams();
  if (groupId) params.append('groupId', groupId);
  const query = params.toString();
  const url = query ? `${TEACHER_LEADS_ENDPOINT}?${query}` : TEACHER_LEADS_ENDPOINT;
  return api.get<{ items: CrmLead[]; total: number }>(url);
}

export async function teacherApproveLead(leadId: string): Promise<CrmLead> {
  return api.post<CrmLead>(`${TEACHER_LEADS_ENDPOINT}/${leadId}/approve`, {});
}

export async function teacherTransferLead(leadId: string, comment: string): Promise<CrmLead> {
  return api.post<CrmLead>(`${TEACHER_LEADS_ENDPOINT}/${leadId}/transfer`, { comment });
}
