export type LessonStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'MISSED';

export interface Lesson {
  id: string;
  groupId: string;
  teacherId: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
  description?: string;
  notes?: string;
  status: LessonStatus;
  vocabularySent: boolean;
  vocabularySentAt?: string;
  feedbacksCompleted?: boolean;
  absenceMarked?: boolean;
  absenceMarkedAt?: string;
  voiceSent?: boolean;
  voiceSentAt?: string;
  textSent?: boolean;
  textSentAt?: string;
  completedAt?: string;
  group: {
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
  };
  teacher: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
  _count?: {
    attendances: number;
    feedbacks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LessonsResponse {
  items: Lesson[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LessonFilters {
  skip?: number;
  take?: number;
  groupId?: string;
  teacherId?: string;
  status?: LessonStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLessonDto {
  groupId: string;
  teacherId: string;
  scheduledAt: string;
  duration?: number;
  topic?: string;
  description?: string;
}

export interface UpdateLessonDto {
  scheduledAt?: string;
  duration?: number;
  topic?: string;
  description?: string;
  notes?: string;
}

export interface CompleteLessonDto {
  notes?: string;
}

export interface CreateRecurringLessonsDto {
  groupId: string;
  teacherId: string;
  weekdays: number[]; // Array of 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  startDate: string;
  endDate: string;
  topic?: string;
  description?: string;
}

export interface LessonStatistics {
  total: number;
  completed: number;
  cancelled: number;
  missed: number;
  inProgress: number;
  scheduled: number;
  completionRate: number;
}
