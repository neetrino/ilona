import { api } from '@/shared/lib/api';
import { getApiBaseUrl } from '@/shared/lib/api-config';
import type {
  CrmLead,
  CrmLeadsResponse,
  CrmLeadFilters,
  CreateLeadDto,
  UpdateLeadDto,
  ChangeStatusDto,
  CrmLeadActivity,
  CrmLeadStatus,
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

export async function updateLead(id: string, data: UpdateLeadDto): Promise<CrmLead> {
  return api.patch<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}`, data);
}

export async function changeLeadStatus(
  id: string,
  data: ChangeStatusDto
): Promise<CrmLead> {
  return api.post<CrmLead>(`${CRM_LEADS_ENDPOINT}/${id}/status`, data);
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
