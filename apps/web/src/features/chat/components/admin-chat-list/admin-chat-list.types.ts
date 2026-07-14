import type { AdminChatGroup, AdminChatUser } from '../../api/chat.api';
import type { Chat, Message } from '../../types';

export type AdminChatTab = 'students' | 'teachers' | 'groups';

export interface AdminChatListProps {
  activeTab: AdminChatTab | null;
  onTabChange: (tab: AdminChatTab) => void;
  onSelectChat: (chat: Chat) => void;
  hasActiveChat?: boolean;
}

export type AdminGroupListItem =
  | { kind: 'custom'; chat: Chat }
  | { kind: 'class'; group: AdminChatGroup };

export interface AdminChatListViewModel {
  activeTab: AdminChatTab | null;
  onTabChange: (tab: AdminChatTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tabLabels: Record<AdminChatTab, string>;
  unreadCounts: { groups: number; teachers: number; students: number };
  isLoading: boolean;
  hasData: boolean;
  sortedStudents: AdminChatUser[];
  sortedTeachers: AdminChatUser[];
  sortedGroupItems: AdminGroupListItem[];
  groupUnreadMap: Map<string, number>;
  activeChat: Chat | null;
  getUserUnreadCount: (userId: string) => number;
  getUserOnlineStatus: (userId: string) => boolean;
  getUserLastMessage: (userId: string) => Message | null | undefined;
  getGroupLastMessage: (groupIdOrChatId: string) => Message | null | undefined;
  handleSelectUser: (userId: string) => Promise<void>;
  handleSelectGroup: (groupId: string) => Promise<void>;
  onSelectChat: (chat: Chat) => void;
}
