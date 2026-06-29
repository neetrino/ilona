import type { Chat } from '../../types';
import type { TeacherAdmin, TeacherGroup, TeacherStudent } from '../../api/chat.api';

export interface TeacherChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export type TeacherChatTab = 'admin' | 'groups' | 'students';

export type TeacherGroupListItem =
  | { kind: 'custom'; chat: Chat }
  | { kind: 'class'; group: TeacherGroup };

export interface MessagePreviewLabels {
  noMessagesYet: string;
  voiceMessage: string;
  photo: string;
  video: string;
  attachment: string;
  systemMessage: string;
  message: string;
}

export interface TeacherChatListViewModel {
  activeTab: TeacherChatTab;
  setActiveTab: (tab: TeacherChatTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadCounts: { groups: number; students: number; admin: number };
  isLoading: boolean;
  hasData: boolean;
  admin: TeacherAdmin | null | undefined;
  sortedGroupItems: TeacherGroupListItem[];
  sortedStudents: TeacherStudent[];
  allChats: Chat[];
  activeChat: Chat | null;
  createDirectChatPending: boolean;
  messagePreviewLabels: MessagePreviewLabels;
  formatTime: (dateStr?: string) => string;
  isUserOnline: (chatId: string, userId: string) => boolean;
  handleGroupClick: (groupId: string, chatId: string | null) => Promise<void>;
  handleStudentClick: (studentUserId: string, chatId: string | null) => Promise<void>;
  handleAdminClick: (adminUserId: string, chatId: string | null) => Promise<void>;
  onSelectChat: (chat: Chat) => void;
}
