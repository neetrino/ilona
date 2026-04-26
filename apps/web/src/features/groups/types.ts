export interface GroupTeacherRef {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Free-form schedule payload stored as JSON in the DB.
 * Each entry represents one weekly recurring class slot.
 */
export interface GroupScheduleEntry {
  /** 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
  dayOfWeek: number;
  /** Start time in 24h "HH:mm" format, local to the center timezone. */
  startTime: string;
  /** End time in 24h "HH:mm" format. */
  endTime: string;
  notes?: string;
}

export interface Group {
  id: string;
  name: string;
  /** Predefined icon id from admin picker; null/undefined = default UI icon. */
  iconKey?: string | null;
  level?: string;
  description?: string;
  maxStudents: number;
  isActive: boolean;
  centerId: string;
  teacherId?: string | null;
  substituteTeacherId?: string | null;
  schedule?: GroupScheduleEntry[] | null;
  center: {
    id: string;
    name: string;
  };
  teacher?: GroupTeacherRef | null;
  substituteTeacher?: GroupTeacherRef | null;
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
  substituteTeacherId?: string;
  schedule?: GroupScheduleEntry[];
  isActive?: boolean;
  iconKey?: string | null;
}

export interface UpdateGroupDto {
  name?: string;
  level?: string;
  description?: string;
  centerId?: string;
  teacherId?: string;
  substituteTeacherId?: string | null;
  schedule?: GroupScheduleEntry[] | null;
  isActive?: boolean;
  iconKey?: string | null;
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
