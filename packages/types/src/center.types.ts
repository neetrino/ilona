// ============================================
// Center & Group Types
// ============================================

export interface Center {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CenterWithGroups extends Center {
  groups: Group[];
  _count?: {
    groups: number;
  };
}

export interface Group {
  id: string;
  name: string;
  level?: string | null;
  description?: string | null;
  maxStudents: number;
  centerId: string;
  teacherId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupWithRelations extends Group {
  center?: Center;
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  _count?: {
    students: number;
    lessons: number;
  };
}

// ============================================
// DTOs
// ============================================

export interface CreateCenterDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

export interface UpdateCenterDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateGroupDto {
  name: string;
  level?: string;
  description?: string;
  maxStudents?: number;
  centerId: string;
  teacherId?: string;
}

export interface UpdateGroupDto {
  name?: string;
  level?: string;
  description?: string;
  maxStudents?: number;
  teacherId?: string;
  isActive?: boolean;
}


