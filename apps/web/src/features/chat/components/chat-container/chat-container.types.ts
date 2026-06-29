import type { Chat } from '../../types';
import type { ChatThemeTokens } from '../../lib/chat-theme';

export interface ChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export interface ChatContainerLayout {
  isFullScreen: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  useAdminPortalLayout: boolean;
  containerHeight: string;
  contentHeight: string;
}

export interface ChatContainerViewModel {
  ui: ChatThemeTokens;
  layout: ChatContainerLayout;
  activeChat: Chat | null;
  isMobileListVisible: boolean;
  mobileChatPanelOpen: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  handleBackToPrevious: () => void;
  handleSelectChat: (chat: Chat) => void;
  handleBack: () => void;
  handleMobileBack: () => void;
  finalizeMobileChatClose: () => void;
  setActiveChat: (chat: Chat | null) => void;
}
