import type { User, UserStatus } from '@/types';

export type StudentLifecycleStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNGROUPED'
  | 'NEW'
  | 'RISK'
  | 'HIGH_RISK';

export type StudentRiskLabel = 'NONE' | 'RISK' | 'HIGH_RISK';

export interface Student {
  id: string;
  userId: string;
  groupId?: string | null;
  teacherId?: string | null;
  age?: number | null;
  /** ISO-8601 date string. */
  dateOfBirth?: string | null;
  /** ISO-8601 date string. */
  firstLessonDate?: string | null;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassportInfo?: string;
  monthlyFee: number;
  notes?: string;
  receiveReports: boolean;
  /** Persisted lifecycle status (separate from User.status). */
  status?: StudentLifecycleStatus;
  /** Persisted risk label. */
  riskLabel?: StudentRiskLabel;
  /** Server-derived risk label for the requested period (overrides persisted one in UI). */
  derivedRiskLabel?: StudentRiskLabel;
  /** Source CRM lead id when student was created from CRM flow. */
  leadId?: string | null;
  /** Server-computed flag for newly paid students coming from CRM (30-day window). */
  isRecentlyPaidFromCrm?: boolean;
  /** ISO datetime when temporary NEW badge expires. */
  newBadgeExpiresAt?: string;
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
    justifiedAbsences?: number;
    unjustifiedAbsences?: number;
  };
  /** Date when student joined a group (manual, Admin-only). ISO date string. */
  registerDate?: string | null;
  enrolledAt?: string;
  groupHistory?: StudentGroupHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentGroupHistoryEntry {
  id: string;
  groupId: string;
  joinedAt: string;
  leftAt?: string | null;
  group: StudentGroup;
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

/** Stable id for list/key/selection: Student.id or OnboardingStudentItem.leadId */
export function getItemId(item: TeacherAssignedItem): string {
  return isOnboardingItem(item) ? item.leadId : item.id;
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
  /** Persisted Student.status filter (NEW, UNGROUPED, RISK, HIGH_RISK, etc.). */
  lifecycleStatuses?: StudentLifecycleStatus[];
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
  age?: number;
  /** ISO date string (YYYY-MM-DD). Either age or dateOfBirth must be provided. */
  dateOfBirth?: string;
  /** ISO date string (YYYY-MM-DD). First lesson date for the student. */
  firstLessonDate?: string;
  groupId?: string;
  teacherId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassportInfo?: string;
  monthlyFee: number;
  notes?: string;
  receiveReports?: boolean;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: number;
  /** ISO date string (YYYY-MM-DD) or null to clear. */
  dateOfBirth?: string | null;
  /** ISO date string (YYYY-MM-DD) or null to clear. */
  firstLessonDate?: string | null;
  status?: UserStatus;
  groupId?: string | null;
  teacherId?: string | null;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassportInfo?: string;
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
  recordings: {
    total: number;
    submitted: number;
    rate: number;
  };
  payments: {
    pending: number;
    overdue: number;
    paid: number;
    rate: number;
  };
  feedbacks: number;
  progress: {
    attendanceRate: number;
    recordingRate: number;
    paymentRate: number;
    overall: number;
  };
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
