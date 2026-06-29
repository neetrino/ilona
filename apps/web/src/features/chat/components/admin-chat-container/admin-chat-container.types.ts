import type { Chat } from '../../types';

export type AdminChatTab = 'students' | 'teachers' | 'groups';

export interface AdminChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export interface AdminChatContainerLayout {
  isFullScreen: boolean;
  containerHeight: string;
  contentHeight: string;
}

export interface AdminChatContainerViewModel {
  layout: AdminChatContainerLayout;
  activeChat: Chat | null;
  activeTab: AdminChatTab | null;
  isMobileListVisible: boolean;
  mobileChatPanelOpen: boolean;
  showCreateGroupChatModal: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  handleBackToPrevious: () => void;
  handleTabChange: (tab: AdminChatTab) => void;
  handleSelectChat: (chat: Chat) => void;
  handleBack: () => void;
  handleMobileBack: () => void;
  finalizeMobileChatClose: () => void;
  handleCustomGroupChatCreated: (chat: Chat) => void;
  setActiveChat: (chat: Chat | null) => void;
  setShowCreateGroupChatModal: (open: boolean) => void;
}
