export interface FeedbacksTabProps {
  lessonId: string;
  embeddedInSheet?: boolean;
}

export interface FeedbackStudentItem {
  id: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
}

export interface FeedbackSaveStatus {
  success: boolean;
  error: string | null;
}

export const FEEDBACK_FIELD_SHELL_CLASS =
  'w-full rounded-[15px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10';
