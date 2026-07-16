/** Admin-only: Fetch students list for chat */
export interface AdminChatUser {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
}

/** Admin-only: Fetch groups list for chat */
export interface AdminChatGroup {
  id: string;
  name: string;
  iconKey?: string | null;
  center?: {
    id: string;
    name: string;
  } | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
  unreadCount: number;
  messageCount?: number;
  updatedAt?: string;
}

/** Admin-only: Fetch all registered users (for add-member picker) */
export interface AdminChatAllUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}

/** Teacher-only: Fetch teacher's assigned groups */
export interface TeacherGroup {
  id: string;
  name: string;
  iconKey?: string | null;
  level?: string | null;
  center?: {
    id: string;
    name: string;
  } | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  /** Total message count in the group chat (fallback when unread not available). */
  messageCount?: number;
  updatedAt: string;
}

/** Teacher-only: Fetch teacher's assigned students */
export interface TeacherStudent {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

/** Teacher-only: Fetch admin user info for direct messaging */
export interface TeacherAdmin {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl?: string | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string | null;
}

/** Student-only: Fetch admin user info for direct messaging */
export interface StudentAdmin {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl?: string | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string | null;
}

/** Student-only: Get voice messages sent to teacher (for Recordings section) */
export interface VoiceToTeacherRecording {
  id: string;
  fileUrl: string;
  fileName?: string;
  duration: number;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface RecordingsDateFilters {
  year?: number;
  month?: number;
  day?: number;
}

export interface AdminStudentRecording {
  id: string;
  fileUrl: string;
  fileName?: string;
  duration: number;
  createdAt: string;
  /** Always voice-to-teacher for this endpoint */
  source?: 'voiceToTeacher';
  student: {
    userId: string;
    firstName: string;
    lastName: string;
  };
  group: {
    id: string | null;
    name: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  center?: {
    id: string;
    name: string;
  } | null;
}

export interface AdminStudentRecordingsFilters {
  /** @deprecated Prefer groupIds */
  groupId?: string;
  /** @deprecated Prefer studentIds */
  studentUserId?: string;
  groupIds?: string[];
  /** Student user ids (message sender ids) */
  studentIds?: string[];
  search?: string;
  skip?: number;
  take?: number;
}

export interface TeacherStudentRecordingsFilters {
  groupId?: string;
  studentUserId?: string;
  search?: string;
}
