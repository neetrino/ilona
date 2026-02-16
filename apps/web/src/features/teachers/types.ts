import type { User, UserStatus } from '@/types';

export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  specialization?: string;
  hourlyRate: number;
  workingDays: string[];
  workingHours?: {
    MON?: Array<{ start: string; end: string }>;
    TUE?: Array<{ start: string; end: string }>;
    WED?: Array<{ start: string; end: string }>;
    THU?: Array<{ start: string; end: string }>;
    FRI?: Array<{ start: string; end: string }>;
    SAT?: Array<{ start: string; end: string }>;
    SUN?: Array<{ start: string; end: string }>;
  } | null;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'status' | 'lastLoginAt' | 'createdAt'>;
  groups?: TeacherGroup[];
  centers?: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    groups: number;
    lessons: number;
    students: number;
  };
  obligationsDoneCount?: number;
  obligationsTotal?: number;
  deductionAmount?: number;
  finalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherGroup {
  id: string;
  name: string;
  level?: string;
  center?: {
    id: string;
    name: string;
  };
  _count?: {
    students: number;
  };
}

export interface TeachersResponse {
  items: Teacher[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TeacherFilters {
  skip?: number;
  take?: number;
  search?: string;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTeacherDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hourlyRate: number;
  workingDays?: string[];
  workingHours?: {
    MON?: Array<{ start: string; end: string }>;
    TUE?: Array<{ start: string; end: string }>;
    WED?: Array<{ start: string; end: string }>;
    THU?: Array<{ start: string; end: string }>;
    FRI?: Array<{ start: string; end: string }>;
    SAT?: Array<{ start: string; end: string }>;
    SUN?: Array<{ start: string; end: string }>;
  };
}

export interface UpdateTeacherDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: UserStatus;
  hourlyRate?: number;
  workingDays?: string[];
  workingHours?: {
    MON?: Array<{ start: string; end: string }>;
    TUE?: Array<{ start: string; end: string }>;
    WED?: Array<{ start: string; end: string }>;
    THU?: Array<{ start: string; end: string }>;
    FRI?: Array<{ start: string; end: string }>;
    SAT?: Array<{ start: string; end: string }>;
    SUN?: Array<{ start: string; end: string }>;
  };
}

export interface TeacherStatistics {
  lessons: {
    total: number;
    completed: number;
    cancelled: number;
    scheduled: number;
  };
  compliance: {
    vocabularyRate: number;
    feedbackRate: number;
  };
  deductions: {
    count: number;
    total: number;
  };
  studentsCount: number;
  groupsCount: number;
}
