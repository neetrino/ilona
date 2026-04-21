import type { Center, CreateCenterDto, UpdateCenterDto } from '@ilona/types';

export interface CenterWithCount extends Center {
  colorHex?: string | null;
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

interface CenterDetailUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface CenterDetailTeacher {
  id: string;
  user: CenterDetailUser | null;
  videoUrl?: string | null;
  _count?: { groups: number };
}

export interface CenterDetailStudent {
  id: string;
  user: CenterDetailUser | null;
  groupId: string;
  groupName: string;
}

export interface CenterDetailGroup {
  id: string;
  name: string;
  schedule: unknown;
  teacher: CenterDetailTeacher | null;
  substituteTeacher: CenterDetailTeacher | null;
  students: Array<{ id: string; user: CenterDetailUser | null }>;
  _count?: { students: number; lessons: number };
}

export interface CenterDetails {
  center: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    colorHex: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  teachers: CenterDetailTeacher[];
  groups: CenterDetailGroup[];
  students: CenterDetailStudent[];
  schedule: Array<{ groupId: string; groupName: string; schedule: unknown }>;
  counts: { teachers: number; groups: number; students: number };
}









