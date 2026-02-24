export interface Feedback {
  id: string;
  lessonId: string;
  studentId: string;
  teacherId: string;
  content: string;
  rating?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
  lesson?: {
    id: string;
    scheduledAt: string;
    topic?: string;
    group: {
      id: string;
      name: string;
      level?: string;
    };
    absenceMarked?: boolean | null;
    absenceMarkedAt?: string | null;
    feedbacksCompleted?: boolean | null;
    voiceSent?: boolean | null;
    voiceSentAt?: string | null;
    textSent?: boolean | null;
    textSentAt?: string | null;
  };
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
}

export interface CreateFeedbackDto {
  lessonId: string;
  studentId: string;
  content: string;
  rating?: number;
  strengths?: string;
  improvements?: string;
}

export interface UpdateFeedbackDto {
  content?: string;
  rating?: number;
  strengths?: string;
  improvements?: string;
}

export interface LessonFeedbackData {
  lesson: {
    id: string;
    scheduledAt: string;
    topic?: string;
    status: string;
    notes?: string | null; // General feedback
  };
  studentsWithFeedback: Array<{
    student: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
      };
    };
    feedback: Feedback | null;
  }>;
}

