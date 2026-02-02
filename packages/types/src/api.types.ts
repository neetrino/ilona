// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// Query Parameters
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface SearchParams {
  search?: string;
}

// ============================================
// Filter Types
// ============================================

export interface UserFilters extends PaginationParams, SortParams, SearchParams {
  role?: string;
  status?: string;
}

export interface LessonFilters extends PaginationParams, SortParams, DateRangeParams {
  groupId?: string;
  teacherId?: string;
  status?: string;
}

export interface AttendanceFilters extends PaginationParams, DateRangeParams {
  studentId?: string;
  groupId?: string;
  isPresent?: boolean;
  absenceType?: string;
}

export interface PaymentFilters extends PaginationParams, SortParams, DateRangeParams {
  studentId?: string;
  status?: string;
  month?: string;
}

export interface ChatFilters extends PaginationParams {
  type?: string;
}

export interface MessageFilters extends PaginationParams {
  chatId: string;
  type?: string;
  before?: Date | string;
  after?: Date | string;
}

// ============================================
// Dashboard Stats
// ============================================

export interface AdminDashboardStats {
  overview: {
    totalCenters: number;
    totalGroups: number;
    totalTeachers: number;
    totalStudents: number;
    activeStudents: number;
  };
  today: {
    lessonsScheduled: number;
    lessonsCompleted: number;
    studentsPresent: number;
    studentsAbsent: number;
  };
  finance: {
    monthlyIncome: number;
    collectedThisMonth: number;
    pendingPayments: number;
    overduePayments: number;
  };
  alerts: {
    studentsAtRisk: number;
    overduePayments: number;
    pendingFeedback: number;
    missingVocabulary: number;
  };
}

export interface TeacherDashboardStats {
  today: {
    lessonsScheduled: number;
    lessonsCompleted: number;
    pendingFeedback: number;
    pendingVocabulary: number;
  };
  groups: {
    totalGroups: number;
    totalStudents: number;
  };
  salary: {
    currentMonth: number;
    deductions: number;
    netEarnings: number;
  };
  performance: {
    lessonsThisMonth: number;
    feedbackCompletionRate: number;
    vocabularyCompletionRate: number;
    attendanceRate: number;
  };
}

export interface StudentDashboardStats {
  upcoming: {
    nextLesson?: {
      id: string;
      scheduledAt: Date;
      topic?: string;
      teacherName: string;
      groupName: string;
    };
    lessonsThisWeek: number;
  };
  attendance: {
    totalLessons: number;
    attended: number;
    absences: number;
    attendanceRate: number;
  };
  payments: {
    nextPayment?: {
      amount: number;
      dueDate: Date;
    };
    hasPendingPayments: boolean;
    hasOverduePayments: boolean;
  };
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export type NotificationType =
  | 'ABSENCE_WARNING'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_OVERDUE'
  | 'LESSON_REMINDER'
  | 'FEEDBACK_REMINDER'
  | 'VOCABULARY_REMINDER'
  | 'NEW_MESSAGE'
  | 'SYSTEM_ANNOUNCEMENT';


