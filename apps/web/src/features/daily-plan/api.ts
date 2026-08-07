import { api } from '@/shared/lib/api';
import type {
  CreateDailyPlanInput,
  DailyPlan,
  DailyPlanFilters,
  DailyPlanList,
  UpdateDailyPlanInput,
} from './types';

const BASE = '/daily-plans';

export async function fetchDailyPlans(filters?: DailyPlanFilters): Promise<DailyPlanList> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.teacherIds && filters.teacherIds.length > 0) {
    filters.teacherIds.forEach((id) => params.append('teacherIds', id));
  }
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.groupIds && filters.groupIds.length > 0) {
    filters.groupIds.forEach((id) => params.append('groupIds', id));
  }
  if (filters?.lessonId) params.append('lessonId', filters.lessonId);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  const query = params.toString();
  return api.get<DailyPlanList>(`${BASE}${query ? `?${query}` : ''}`);
}

export async function fetchDailyPlan(id: string): Promise<DailyPlan> {
  return api.get<DailyPlan>(`${BASE}/${id}`);
}

export async function createDailyPlan(input: CreateDailyPlanInput): Promise<DailyPlan> {
  return api.post<DailyPlan>(BASE, input);
}

export async function updateDailyPlan(
  id: string,
  input: UpdateDailyPlanInput,
): Promise<DailyPlan> {
  return api.patch<DailyPlan>(`${BASE}/${id}`, input);
}

export async function deleteDailyPlan(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`${BASE}/${id}`);
}
