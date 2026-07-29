'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatChatListTime } from '../utils/chat-utils';
import type { Message } from '../types';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import type { GroupInfoLinkItem, GroupInfoTab } from './group-members-modal.util';

interface GroupInfoSharedPanelsProps {
  voiceMessages: Message[];
  linkItems: GroupInfoLinkItem[];
  activeTab: Exclude<GroupInfoTab, 'members'>;
  isLoading: boolean;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 px-3 py-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function VoicePanel({ messages }: { messages: Message[] }) {
  const tChat = useTranslations('chat');
  const locale = useLocale();

  if (messages.length === 0) {
    return <EmptyState message={tChat('noSharedVoice')} />;
  }

  return (
    <ul className="space-y-2 px-2 pb-2">
      {messages.map((message) => {
        const senderName = message.sender
          ? `${message.sender.firstName} ${message.sender.lastName}`.trim()
          : tChat('unknownUser');

        return (
          <li key={message.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-800">{senderName}</p>
              <span className="shrink-0 text-[11px] text-slate-400">
                {formatChatListTime(message.createdAt, locale, tChat('yesterday'))}
              </span>
            </div>
            {message.fileUrl ? (
              <VoiceMessagePlayer
                fileUrl={message.fileUrl}
                duration={message.duration}
                fileName={message.fileName}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function LinksPanel({ items }: { items: GroupInfoLinkItem[] }) {
  const tChat = useTranslations('chat');
  const locale = useLocale();

  if (items.length === 0) {
    return <EmptyState message={tChat('noSharedLinks')} />;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 px-3 py-3 transition-colors hover:bg-slate-50"
          >
            <span className="truncate text-sm font-medium text-[#1010a3]">{item.url}</span>
            <span className="truncate text-xs text-slate-500">
              {item.senderName || tChat('unknownUser')} ·{' '}
              {formatChatListTime(item.createdAt, locale, tChat('yesterday'))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function GroupInfoSharedPanels({
  voiceMessages,
  linkItems,
  activeTab,
  isLoading,
}: GroupInfoSharedPanelsProps) {
  if (isLoading) return <LoadingState />;

  if (activeTab === 'voice') return <VoicePanel messages={voiceMessages} />;
  return <LinksPanel items={linkItems} />;
}
