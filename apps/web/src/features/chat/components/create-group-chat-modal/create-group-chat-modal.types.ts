import type { CSSProperties, TouchEvent } from 'react';
import type { Chat } from '../../types';
import type { AdminChatAllUser } from '../../api/chat.api';

export interface CreateGroupChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (chat: Chat) => void;
}

export interface CreateGroupChatModalViewModel {
  tChat: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string, values?: Record<string, string | number>) => string;
  name: string;
  setName: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  selectedIds: Set<string>;
  isDialogOpen: boolean;
  dragStyle: CSSProperties | undefined;
  overlayStyle: CSSProperties;
  contentStyle: CSSProperties;
  isBaseLayer: boolean;
  selectableUsers: AdminChatAllUser[];
  isLoading: boolean;
  teacherIds: string[];
  allTeachersSelected: boolean;
  createChatPending: boolean;
  createChatError: unknown;
  toggleUser: (userId: string) => void;
  toggleAllTeachers: () => void;
  handleSubmit: () => Promise<void>;
  requestClose: () => void;
  handleDragStart: (event: TouchEvent<HTMLDivElement>) => void;
  handleDragMove: (event: TouchEvent<HTMLDivElement>) => void;
  handleDragEnd: () => void;
}
