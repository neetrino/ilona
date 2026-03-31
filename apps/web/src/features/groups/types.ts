export interface Group {
  id: string;
  name: string;
  level?: string;
  description?: string;
  maxStudents: number;
  isActive: boolean;
  centerId: string;
  teacherId?: string | null;
  center: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  } | null;
  _count?: {
    students: number;
    lessons: number;
  };
  /** Present when listing groups with `includeStudents` (e.g. board view). */
  students?: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GroupsResponse {
  items: Group[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GroupFilters {
  skip?: number;
  take?: number;
  search?: string;
  centerId?: string;
  teacherId?: string;
  isActive?: boolean;
  level?: string;
  /** Load student names for each group (board cards). */
  includeStudents?: boolean;
}

export interface CreateGroupDto {
  name: string;
  level?: string;
  description?: string;
  centerId: string;
  teacherId?: string;
  isActive?: boolean;
}

export interface UpdateGroupDto {
  name?: string;
  level?: string;
  description?: string;
  centerId?: string;
  teacherId?: string;
  isActive?: boolean;
}

/** Student item returned by GET /groups/:groupId/students */
export interface GroupStudentItem {
  id: string;
  enrolledAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
}

export interface GroupStudentsResponse {
  items: GroupStudentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
