'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getProxiedFileUrl } from '@/shared/lib/api';
import { formatTime } from '../utils/chat-utils';
import type { Message } from '../types';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import type { GroupInfoLinkItem } from './group-members-modal.util';

interface GroupInfoSharedPanelsProps {
  mediaMessages: Message[];
  voiceMessages: Message[];
  linkItems: GroupInfoLinkItem[];
  activeTab: 'media' | 'voice' | 'links';
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

function MediaPanel({ messages }: { messages: Message[] }) {
  const tChat = useTranslations('chat');
  const locale = useLocale();

  if (messages.length === 0) {
    return <EmptyState message={tChat('noSharedMedia')} />;
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
      {messages.map((message) => {
        const src = getProxiedFileUrl(message.fileUrl) || message.fileUrl || '';
        const isImage = message.type === 'IMAGE';
        const isVideo = message.type === 'VIDEO';

        return (
          <a
            key={message.id}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden rounded-lg bg-slate-100"
            title={message.fileName || formatTime(message.createdAt, locale)}
          >
            {isImage ? (
              <Image src={src} alt="" fill className="object-cover" unoptimized sizes="120px" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center">
                <svg
                  className="h-6 w-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  {isVideo ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  )}
                </svg>
                <span className="line-clamp-2 text-[10px] text-slate-600">
                  {message.fileName || (isVideo ? tChat('videoFile') : tChat('fileAttachment'))}
                </span>
              </div>
            )}
          </a>
        );
      })}
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
                {formatTime(message.createdAt, locale)}
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
              {item.senderName || tChat('unknownUser')} · {formatTime(item.createdAt, locale)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function GroupInfoSharedPanels({
  mediaMessages,
  voiceMessages,
  linkItems,
  activeTab,
  isLoading,
}: GroupInfoSharedPanelsProps) {
  if (isLoading) return <LoadingState />;

  if (activeTab === 'media') return <MediaPanel messages={mediaMessages} />;
  if (activeTab === 'voice') return <VoicePanel messages={voiceMessages} />;
  return <LinksPanel items={linkItems} />;
}
