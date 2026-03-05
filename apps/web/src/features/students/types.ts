import type { User, UserStatus } from '@/types';

export interface Student {
  id: string;
  userId: string;
  groupId?: string | null;
  teacherId?: string | null;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  monthlyFee: number;
  notes?: string;
  receiveReports: boolean;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'status' | 'lastLoginAt' | 'createdAt'>;
  group?: StudentGroup | null;
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  } | null;
  attendanceSummary?: {
    totalClasses: number;
    absences: number;
  };
  /** Date when student joined a group (manual, Admin-only). ISO date string. */
  registerDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  level?: string;
  center?: {
    id: string;
    name: string;
  };
}

/** Onboarding entry: lead assigned to teacher/group from CRM, not yet a full student */
export interface OnboardingStudentItem {
  type: 'onboarding';
  leadId: string;
  status?: string; // NEW | FIRST_LESSON – Approve/Transfer only valid for FIRST_LESSON
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  teacherApprovedAt: string | null;
  transferFlag: boolean;
  transferComment: string | null;
  groupId: string | null;
  group?: StudentGroup | null;
}

/** Item in teacher's My Students list: either a full student or an onboarding lead */
export type TeacherAssignedItem = Student | OnboardingStudentItem;

export function isOnboardingItem(
  item: TeacherAssignedItem,
): item is OnboardingStudentItem {
  return 'type' in item && item.type === 'onboarding';
}

export interface StudentsResponse {
  items: TeacherAssignedItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalMonthlyFees: number;
}

export interface StudentFilters {
  skip?: number;
  take?: number;
  search?: string;
  groupId?: string;
  groupIds?: string[];
  status?: UserStatus;
  statusIds?: UserStatus[];
  teacherId?: string;
  teacherIds?: string[];
  centerId?: string;
  centerIds?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  month?: number; // 1-12 (January-December)
  year?: number; // e.g., 2024
}

export interface CreateStudentDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  groupId?: string;
  teacherId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  monthlyFee: number;
  notes?: string;
  receiveReports?: boolean;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: UserStatus;
  groupId?: string;
  teacherId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  monthlyFee?: number;
  notes?: string;
  receiveReports?: boolean;
  /** Date when student joined a group (manual). ISO date string (YYYY-MM-DD) or null to clear. */
  registerDate?: string | null;
}

export interface StudentStatistics {
  attendance: {
    total: number;
    present: number;
    absent: number;
    unjustifiedAbsences: number;
    rate: number;
  };
  payments: {
    pending: number;
    overdue: number;
  };
  feedbacks: number;
}

export interface StudentDashboard {
  student: Student;
  upcomingLessons: StudentUpcomingLesson[];
  recentFeedbacks: StudentFeedback[];
  pendingPayments: StudentPayment[];
  statistics: StudentStatistics;
}

export interface StudentUpcomingLesson {
  id: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
  status: string;
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface StudentFeedback {
  id: string;
  rating?: number;
  comment?: string;
  createdAt: string;
  lesson: {
    scheduledAt: string;
    topic?: string;
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface StudentPayment {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  month: number;
  year: number;
}
