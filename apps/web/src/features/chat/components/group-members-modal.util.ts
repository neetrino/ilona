import { cn } from '@/shared/lib/utils';
import type { ChatParticipant, Message } from '../types';

export type GroupInfoTab = 'members' | 'voice' | 'links';

export const GROUP_INFO_TABS: GroupInfoTab[] = ['members', 'voice', 'links'];

const LINK_URL_REGEX = /https?:\/\/[^\s<>"'`]+/gi;

export function participantDisplayName(participant: ChatParticipant): string {
  const { firstName, lastName } = participant.user;
  return `${firstName} ${lastName}`.trim() || participant.user.id;
}

export function roleTranslationKey(
  role: string,
): 'admin' | 'manager' | 'teacher' | 'student' | null {
  const normalized = role.toLowerCase();
  if (
    normalized === 'admin' ||
    normalized === 'manager' ||
    normalized === 'teacher' ||
    normalized === 'student'
  ) {
    return normalized;
  }
  return null;
}

export function rolePillClass(role: string): string {
  const key = role.toLowerCase();
  if (key === 'admin') return 'bg-violet-100 text-violet-700';
  if (key === 'manager') return 'bg-amber-100 text-amber-800';
  if (key === 'teacher') return 'bg-sky-100 text-sky-700';
  if (key === 'student') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-600';
}

export function sortParticipants(participants: ChatParticipant[]): ChatParticipant[] {
  return [...participants].sort((a, b) =>
    participantDisplayName(a).localeCompare(participantDisplayName(b), undefined, {
      sensitivity: 'base',
    }),
  );
}

export function flattenMessagePages(
  pages: Array<{ items: Message[] }> | undefined,
): Message[] {
  if (!pages) return [];
  return pages.flatMap((page) => page.items);
}

export function filterVoiceMessages(messages: Message[]): Message[] {
  return messages.filter((message) => message.type === 'VOICE' && Boolean(message.fileUrl));
}

export interface GroupInfoLinkItem {
  id: string;
  url: string;
  messageId: string;
  createdAt: string;
  senderName: string;
}

export function extractLinkItems(messages: Message[]): GroupInfoLinkItem[] {
  const items: GroupInfoLinkItem[] = [];
  for (const message of messages) {
    if (!message.content) continue;
    const matches = message.content.match(LINK_URL_REGEX);
    if (!matches) continue;
    const senderName = message.sender
      ? `${message.sender.firstName} ${message.sender.lastName}`.trim()
      : '';
    matches.forEach((url, index) => {
      items.push({
        id: `${message.id}-${index}`,
        url: url.replace(/[),.;!?]+$/g, ''),
        messageId: message.id,
        createdAt: message.createdAt,
        senderName,
      });
    });
  }
  return items;
}

export function groupInfoPanelClassName(isVisible: boolean, hasDragStyle: boolean): string {
  return cn(
    'fixed z-50 flex flex-col',
    'inset-x-0 bottom-0 mx-auto w-full max-w-lg',
    'tablet:inset-x-auto tablet:inset-y-0 tablet:right-0 tablet:left-auto tablet:bottom-auto tablet:mx-0 tablet:h-full tablet:max-w-none tablet:w-[22.5rem] min-[1366px]:w-[24rem]',
    hasDragStyle
      ? 'transition-none'
      : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
    isVisible
      ? 'translate-y-0 tablet:translate-x-0'
      : 'pointer-events-none translate-y-full tablet:translate-y-0 tablet:translate-x-full',
  );
}

export const GROUP_INFO_PANEL_INNER_CLASS = cn(
  'relative flex flex-col overflow-hidden border-[rgba(14,14,16,0.08)] bg-white',
  'max-h-[68dvh] min-h-[22rem] rounded-t-[1.5rem] border border-b-0 shadow-[0_-12px_36px_rgba(0,0,0,0.14)]',
  'tablet:h-full tablet:max-h-none tablet:min-h-0 tablet:rounded-none tablet:rounded-l-2xl tablet:border tablet:border-r-0 tablet:shadow-2xl',
);
