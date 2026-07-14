import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { sortChatListItems, type ChatListSortable } from '../../utils/chat-utils';
import type {
  Chat,
  Message,
  MessageType,
  MessagesResponse,
} from '../../types';
import type {
  StudentAdmin,
  TeacherAdmin,
  TeacherGroup,
  TeacherStudent,
} from '../../api/chat.api';
import { useChatStore } from '../../store/chat.store';
import { chatKeys } from './chat-query-keys';

export type MessagesInfiniteData = InfiniteData<MessagesResponse>;

export const PENDING_MESSAGE_ID_PREFIX = 'pending-';

export function isPendingMessageId(messageId: string): boolean {
  return messageId.startsWith(PENDING_MESSAGE_ID_PREFIX);
}

export function createOptimisticTextMessage(params: {
  clientId: string;
  chatId: string;
  content: string;
  type: MessageType;
  senderId: string;
  sender?: Message['sender'];
}): Message {
  const now = new Date().toISOString();

  return {
    id: params.clientId,
    chatId: params.chatId,
    senderId: params.senderId,
    sender: params.sender,
    type: params.type,
    content: params.content,
    isEdited: false,
    createdAt: now,
    updatedAt: now,
    metadata: { pending: true },
  };
}

function createMessagesCacheSeed(message: Message): MessagesInfiniteData {
  return {
    pages: [{ items: [message], hasMore: false, nextCursor: null }],
    pageParams: [undefined],
  };
}

function shouldIncrementUnread(chatId: string, message: Message): boolean {
  const { user } = useAuthStore.getState();
  if (!user?.id || message.senderId === user.id) return false;
  const { activeChat } = useChatStore.getState();
  // Open conversation is marked read immediately — do not inflate the badge.
  return activeChat?.id !== chatId;
}

function bumpUnread(count: number | undefined, shouldBump: boolean): number {
  return shouldBump ? (count || 0) + 1 : count || 0;
}

function updateChatListForMessage(
  queryClient: QueryClient,
  chatId: string,
  message: Message,
) {
  const now = new Date().toISOString();
  const lastMessageAt = message.createdAt || now;
  const incrementUnread = shouldIncrementUnread(chatId, message);

  queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
    if (!oldData) return oldData;

    return sortChatListItems(
      oldData.map((chat) => {
        if (chat.id !== chatId) return chat;

        return {
          ...chat,
          lastMessage: message,
          lastMessageAt,
          updatedAt: now,
          unreadCount: bumpUnread(chat.unreadCount, incrementUnread),
        };
      }),
      (chat) => ({
        lastMessage: chat.lastMessage as ChatListSortable['lastMessage'],
        lastMessageAt: chat.lastMessageAt,
        updatedAt: chat.updatedAt,
        unreadCount: chat.unreadCount,
      }),
    );
  });

  const teacherLastMessage = {
    id: message.id,
    type: message.type,
    content: message.content,
    fileName: message.fileName,
    createdAt: message.createdAt,
    sender: message.sender
      ? {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
        }
      : { id: message.senderId, firstName: '', lastName: '' },
  };

  queryClient.setQueriesData<TeacherGroup[]>(
    { queryKey: [...chatKeys.all, 'teacher', 'groups'] },
    (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((group) =>
        group.chatId === chatId
          ? {
              ...group,
              lastMessage: teacherLastMessage,
              unreadCount: bumpUnread(group.unreadCount, incrementUnread),
              updatedAt: now,
            }
          : group,
      );
    },
  );

  queryClient.setQueriesData<TeacherStudent[]>(
    { queryKey: [...chatKeys.all, 'teacher', 'students'] },
    (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((student) =>
        student.chatId === chatId
          ? {
              ...student,
              lastMessage: teacherLastMessage,
              unreadCount: bumpUnread(student.unreadCount, incrementUnread),
              updatedAt: now,
            }
          : student,
      );
    },
  );

  queryClient.setQueryData(chatKeys.teacherAdmin(), (oldData: TeacherAdmin | null | undefined) => {
    if (!oldData || oldData.chatId !== chatId) return oldData;
    return {
      ...oldData,
      lastMessage: teacherLastMessage,
      unreadCount: bumpUnread(oldData.unreadCount, incrementUnread),
      updatedAt: now,
    };
  });

  queryClient.setQueryData(chatKeys.studentAdmin(), (oldData: StudentAdmin | null | undefined) => {
    if (!oldData || oldData.chatId !== chatId) return oldData;
    return {
      ...oldData,
      lastMessage: teacherLastMessage,
      unreadCount: bumpUnread(oldData.unreadCount, incrementUnread),
      updatedAt: now,
    };
  });
}

function appendMessageToMessagesCache(
  pages: MessagesInfiniteData['pages'],
  message: Message,
  removeMatchingPending = false,
): MessagesInfiniteData['pages'] {
  const withoutPending = removeMatchingPending
    ? pages.map((page) => ({
        ...page,
        items: page.items.filter(
          (item) =>
            !isPendingMessageId(item.id) ||
            item.senderId !== message.senderId ||
            item.content !== message.content,
        ),
      }))
    : pages;

  const exists = withoutPending.some((page) =>
    page.items.some((item) => item.id === message.id),
  );
  if (exists) return withoutPending;

  return withoutPending.map((page, index) =>
    index === 0 ? { ...page, items: [...page.items, message] } : page,
  );
}

export function pushMessageToCache(
  queryClient: QueryClient,
  chatId: string,
  message: Message,
) {
  queryClient.setQueryData(
    chatKeys.messages(chatId),
    (oldData: MessagesInfiniteData | undefined) => {
      if (!oldData) {
        return createMessagesCacheSeed(message);
      }

      return {
        ...oldData,
        pages: appendMessageToMessagesCache(oldData.pages, message),
      };
    },
  );
  updateChatListForMessage(queryClient, chatId, message);
}

export function upsertIncomingMessageInCache(
  queryClient: QueryClient,
  chatId: string,
  message: Message,
) {
  queryClient.setQueryData(
    chatKeys.messages(chatId),
    (oldData: MessagesInfiniteData | undefined) => {
      if (!oldData) {
        return createMessagesCacheSeed(message);
      }

      return {
        ...oldData,
        pages: appendMessageToMessagesCache(oldData.pages, message, true),
      };
    },
  );
  updateChatListForMessage(queryClient, chatId, message);
}

export function removeMessageFromMessagesCache(
  queryClient: QueryClient,
  chatId: string,
  messageId: string,
) {
  queryClient.setQueryData(
    chatKeys.messages(chatId),
    (oldData: MessagesInfiniteData | undefined) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== messageId),
        })),
      };
    },
  );
}

function patchChatParticipantLastRead(
  chat: Chat,
  userId: string,
  readAt: string,
): Chat {
  return {
    ...chat,
    participants: chat.participants.map((participant) =>
      participant.userId === userId ? { ...participant, lastReadAt: readAt } : participant,
    ),
  };
}

/** Apply peer read receipt so own-message ticks can flip to double-check. */
export function applyChatReadReceiptInCache(
  queryClient: QueryClient,
  chatId: string,
  userId: string,
  readAt: string | Date,
): void {
  const readAtIso = typeof readAt === 'string' ? readAt : new Date(readAt).toISOString();

  queryClient.setQueryData(chatKeys.detail(chatId), (oldData: Chat | undefined) => {
    if (!oldData) return oldData;
    return patchChatParticipantLastRead(oldData, userId, readAtIso);
  });

  queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
    if (!oldData) return oldData;
    return oldData.map((chat) =>
      chat.id === chatId ? patchChatParticipantLastRead(chat, userId, readAtIso) : chat,
    );
  });

  const { activeChat, setActiveChat } = useChatStore.getState();
  if (activeChat?.id === chatId) {
    setActiveChat(patchChatParticipantLastRead(activeChat, userId, readAtIso));
  }
}

export function clearChatUnreadInCache(queryClient: QueryClient, chatId: string): void {
  queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
    if (!oldData) return oldData;
    return oldData.map((chat) =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
    );
  });

  queryClient.setQueryData(chatKeys.detail(chatId), (oldData: Chat | undefined) => {
    if (!oldData) return oldData;
    return { ...oldData, unreadCount: 0 };
  });

  queryClient.setQueriesData<TeacherGroup[]>(
    { queryKey: [...chatKeys.all, 'teacher', 'groups'] },
    (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((group) =>
        group.chatId === chatId ? { ...group, unreadCount: 0 } : group,
      );
    },
  );

  queryClient.setQueriesData<TeacherStudent[]>(
    { queryKey: [...chatKeys.all, 'teacher', 'students'] },
    (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((student) =>
        student.chatId === chatId ? { ...student, unreadCount: 0 } : student,
      );
    },
  );

  queryClient.setQueryData(chatKeys.teacherAdmin(), (oldData: TeacherAdmin | null | undefined) => {
    if (!oldData || oldData.chatId !== chatId) return oldData;
    return { ...oldData, unreadCount: 0 };
  });

  queryClient.setQueryData(chatKeys.studentAdmin(), (oldData: StudentAdmin | null | undefined) => {
    if (!oldData || oldData.chatId !== chatId) return oldData;
    return { ...oldData, unreadCount: 0 };
  });

  const { activeChat, setActiveChat } = useChatStore.getState();
  if (activeChat?.id === chatId) {
    setActiveChat({ ...activeChat, unreadCount: 0 });
  }
}
