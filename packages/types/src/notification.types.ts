export const NOTIFICATION_TYPES = [
  'planned_absence',
  'absence_warning',
  'NEW_STUDENT_IN_GROUP',
  'SUBSTITUTE_ASSIGNED',
  'GROUP_TEACHER_MENTION',
  'STUDENT_LEVEL_ALERT',
  'STUDENT_FREQUENT_LATE',
  'DAILY_BRANCH_REPORT',
  'TEACHER_MISSED_DEADLINE',
  'PAYMENT_CONFIRMED',
  'PAYMENT_OVERDUE',
  'STUDENT_CHURN_RISK',
  'GROUP_UNPAID_TUITION',
  'QUARTERLY_REPORT_DEADLINE',
  'STUDENT_RECORDING_MISSING',
  'STUDENT_LESSON_RECORDING_DONE',
  'STUDENT_ABSENCE',
] as const;

export type InboxNotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationData = {
  dedupeKey?: string;
  href?: string;
  centerId?: string;
  studentId?: string;
  groupId?: string;
  lessonId?: string;
  paymentId?: string;
  chatId?: string;
  messageId?: string;
  teacherId?: string;
  /** Set when the student sent the missing lesson voice. */
  recordingCompleted?: boolean;
};

export type PortalNotification = {
  id: string;
  type: string;
  title: string;
  content: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: PortalNotification[];
  unreadCount: number;
  nextCursor: string | null;
};

export type NotificationUnreadCount = {
  unreadCount: number;
};
