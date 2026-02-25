import { create } from 'zustand';
import type { Chat, Message } from '../types';

const CHAT_STATE_STORAGE_KEY_PREFIX = 'chat-state-';

interface TypingUser {
  chatId: string;
  userId: string;
  timestamp: number;
}

interface ChatState {
  // Account-scoped state: each account (e.g. Admin vs Student) has isolated chat state
  accountKey: string | null;
  activeChatByAccount: Record<string, Chat | null>;
  setAccountKey: (key: string | null) => void;

  // Active chat (current account's selection; derived from activeChatByAccount[accountKey])
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;

  // Typing indicators
  typingUsers: TypingUser[];
  addTypingUser: (chatId: string, userId: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  getTypingUsers: (chatId: string) => string[];

  // UI state
  isMobileListVisible: boolean;
  setMobileListVisible: (visible: boolean) => void;

  // Message input drafts
  drafts: Map<string, string>;
  setDraft: (chatId: string, content: string) => void;
  getDraft: (chatId: string) => string;
  clearDraft: (chatId: string) => void;

  // Reply to message
  replyTo: Message | null;
  setReplyTo: (message: Message | null) => void;

  // Edit message
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;

  // Clear all state
  reset: () => void;
}

// Auto-remove typing indicator after 3 seconds
const TYPING_TIMEOUT = 3000;

function getStoredChatForAccount(key: string): Chat | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHAT_STATE_STORAGE_KEY_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Chat;
  } catch {
    return null;
  }
}

function setStoredChatForAccount(key: string, chat: Chat | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (chat) {
      sessionStorage.setItem(CHAT_STATE_STORAGE_KEY_PREFIX + key, JSON.stringify(chat));
    } else {
      sessionStorage.removeItem(CHAT_STATE_STORAGE_KEY_PREFIX + key);
    }
  } catch {
    // ignore
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  accountKey: null,
  activeChatByAccount: {},
  setAccountKey: (key) => {
    const state = get();
    if (key === state.accountKey) return;
    if (key === null) {
      set({ accountKey: null, activeChat: null });
      return;
    }
    const byAccount = { ...state.activeChatByAccount };
    if (byAccount[key] === undefined) {
      const stored = getStoredChatForAccount(key);
      if (stored) byAccount[key] = stored;
      else byAccount[key] = null;
    }
    set({
      accountKey: key,
      activeChatByAccount: byAccount,
      activeChat: byAccount[key] ?? null,
      replyTo: null,
      editingMessage: null,
    });
  },

  // Active chat (for current account)
  activeChat: null,
  setActiveChat: (chat) => {
    const { accountKey, activeChatByAccount } = get();
    if (accountKey) {
      setStoredChatForAccount(accountKey, chat);
      set({
        activeChatByAccount: { ...activeChatByAccount, [accountKey]: chat },
        activeChat: chat,
        replyTo: null,
        editingMessage: null,
      });
    } else {
      set({ activeChat: chat, replyTo: null, editingMessage: null });
    }
  },

  // Typing indicators
  typingUsers: [],
  addTypingUser: (chatId, userId) => {
    set((state) => {
      // Remove existing entry for this user in this chat
      const filtered = state.typingUsers.filter(
        (t) => !(t.chatId === chatId && t.userId === userId)
      );
      return {
        typingUsers: [...filtered, { chatId, userId, timestamp: Date.now() }],
      };
    });

    // Auto-remove after timeout
    setTimeout(() => {
      get().removeTypingUser(chatId, userId);
    }, TYPING_TIMEOUT);
  },
  removeTypingUser: (chatId, userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (t) => !(t.chatId === chatId && t.userId === userId)
      ),
    }));
  },
  getTypingUsers: (chatId) => {
    const now = Date.now();
    return get()
      .typingUsers.filter((t) => t.chatId === chatId && now - t.timestamp < TYPING_TIMEOUT)
      .map((t) => t.userId);
  },

  // UI state
  isMobileListVisible: true,
  setMobileListVisible: (visible) => set({ isMobileListVisible: visible }),

  // Message drafts
  drafts: new Map(),
  setDraft: (chatId, content) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      if (content) {
        newDrafts.set(chatId, content);
      } else {
        newDrafts.delete(chatId);
      }
      return { drafts: newDrafts };
    });
  },
  getDraft: (chatId) => get().drafts.get(chatId) || '',
  clearDraft: (chatId) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      newDrafts.delete(chatId);
      return { drafts: newDrafts };
    });
  },

  // Reply
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message, editingMessage: null }),

  // Edit
  editingMessage: null,
  setEditingMessage: (message) => set({ editingMessage: message, replyTo: null }),

  // Reset
  reset: () =>
    set({
      accountKey: null,
      activeChatByAccount: {},
      activeChat: null,
      typingUsers: [],
      isMobileListVisible: true,
      drafts: new Map(),
      replyTo: null,
      editingMessage: null,
    }),
}));

// Selectors
export const selectActiveChat = (state: ChatState) => state.activeChat;
export const selectTypingUsers = (chatId: string) => (state: ChatState) =>
  state.getTypingUsers(chatId);

/**
 * Call from auth logout so the previous user's chat state and sessionStorage
 * do not leak to the next user (e.g. Admin's chats showing for Student after logout).
 */
export function clearChatStateOnLogout(): void {
  useChatStore.getState().reset();
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CHAT_STATE_STORAGE_KEY_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}
