// ============================================
// Lesson Types
// ============================================

export enum LessonStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED',
  REPLACED = 'REPLACED',
}

export interface Lesson {
  id: string;
  groupId: string;
  teacherId: string;
  scheduledAt: Date;
  duration: number; // minutes
  topic?: string | null;
  description?: string | null;
  status: LessonStatus;
  vocabularySent: boolean;
  vocabularySentAt?: Date | null;
  feedbacksCompleted: boolean;
  completedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonWithRelations extends Lesson {
  group?: {
    id: string;
    name: string;
    level?: string | null;
    center?: {
      id: string;
      name: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    attendances: number;
    feedbacks: number;
  };
}

export interface Feedback {
  id: string;
  lessonId: string;
  studentId: string;
  teacherId: string;
  content: string;
  rating?: number | null; // 1-5
  strengths?: string | null;
  improvements?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Lesson Completion Requirements
// ============================================

export interface LessonCompletionStatus {
  lessonId: string;
  attendanceCompleted: boolean;
  attendanceCount: number;
  feedbackCompleted: boolean;
  feedbackCount: number;
  feedbackRequired: number;
  vocabularySent: boolean;
  canComplete: boolean;
  missingRequirements: string[];
}

// ============================================
// DTOs
// ============================================

export interface CreateLessonDto {
  groupId: string;
  teacherId: string;
  scheduledAt: Date;
  duration?: number;
  topic?: string;
  description?: string;
}

export interface UpdateLessonDto {
  scheduledAt?: Date;
  duration?: number;
  topic?: string;
  description?: string;
  status?: LessonStatus;
  notes?: string;
}

export interface CreateFeedbackDto {
  lessonId: string;
  studentId: string;
  content: string;
  rating?: number;
  strengths?: string;
  improvements?: string;
}

export interface CompleteLessonDto {
  lessonId: string;
  notes?: string;
}


