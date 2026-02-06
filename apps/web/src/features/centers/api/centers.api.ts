import { api } from '@/shared/lib/api';
import type {
  Center,
  CentersResponse,
  CenterFilters,
  CreateCenterDto,
  UpdateCenterDto,
} from '../types';

const CENTERS_ENDPOINT = '/centers';

/**
 * Fetch all centers with optional filters
 */
export async function fetchCenters(filters?: CenterFilters): Promise<CentersResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

  const query = params.toString();
  const url = query ? `${CENTERS_ENDPOINT}?${query}` : CENTERS_ENDPOINT;
  
  return api.get<CentersResponse>(url);
}

/**
 * Fetch a single center by ID
 */
export async function fetchCenter(id: string): Promise<Center> {
  return api.get<Center>(`${CENTERS_ENDPOINT}/${id}`);
}

/**
 * Create a new center
 */
export async function createCenter(data: CreateCenterDto): Promise<Center> {
  return api.post<Center>(CENTERS_ENDPOINT, data);
}

/**
 * Update an existing center
 */
export async function updateCenter(id: string, data: UpdateCenterDto): Promise<Center> {
  return api.put<Center>(`${CENTERS_ENDPOINT}/${id}`, data);
}

/**
 * Delete a center
 */
export async function deleteCenter(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${CENTERS_ENDPOINT}/${id}`);
}

/**
 * Toggle center active status
 */
export async function toggleCenterActive(id: string): Promise<Center> {
  return api.patch<Center>(`${CENTERS_ENDPOINT}/${id}/toggle-active`, {});
}




