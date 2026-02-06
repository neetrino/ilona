import type { Center, CreateCenterDto, UpdateCenterDto } from '@ilona/types';

export interface CenterWithCount extends Center {
  _count?: {
    groups: number;
  };
}

export interface CentersResponse {
  items: CenterWithCount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CenterFilters {
  skip?: number;
  take?: number;
  search?: string;
  isActive?: boolean;
}

export type { Center, CreateCenterDto, UpdateCenterDto };




