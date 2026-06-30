import { cn } from '@/shared/lib/utils';

export const ADMIN_CHAT_EMPTY_PANE_BG_CLASS = 'bg-white lg:bg-[#fafafa]';

const ADMIN_CHAT_LIST_PANE_BASE_CLASS =
  'flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:w-80 lg:shrink-0 lg:flex-none';

export function getAdminChatListPaneClass(hasActiveChat: boolean): string {
  return cn(
    ADMIN_CHAT_LIST_PANE_BASE_CLASS,
    'relative z-[1] lg:rounded-r-[30px] lg:border-r lg:border-slate-200/80 lg:shadow-[4px_0_24px_rgba(14,14,16,0.08)]',
    hasActiveChat ? 'bg-white' : ADMIN_CHAT_EMPTY_PANE_BG_CLASS,
  );
}

const ADMIN_CHAT_LIST_ITEM_BASE =
  'flex w-full items-center gap-3 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30 focus-visible:ring-inset';

export function getAdminChatListItemClass(isActive: boolean): string {
  return cn(ADMIN_CHAT_LIST_ITEM_BASE, isActive ? 'bg-[#1010a3]/10' : 'hover:bg-slate-100');
}

export const ADMIN_CHAT_LIST_ITEM_TITLE_CLASS = 'truncate text-sm font-semibold text-slate-900';

export const ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS = 'truncate text-xs text-slate-500';
