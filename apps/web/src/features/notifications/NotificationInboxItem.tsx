'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PortalNotification } from '@ilona/types';
import { cn } from '@/shared/lib/utils';
import { NotificationInboxIcon } from './NotificationInboxIcon';
import {
  formatInboxTime,
  inboxMeta,
  isLetterNotification,
  isRecordingCompleted,
  notificationDetail,
} from './notification-presentation';

type NotificationInboxItemProps = {
  item: PortalNotification;
  locale: string;
  onOpen: (item: PortalNotification) => void;
};

export function NotificationInboxItem({ item, locale, onOpen }: NotificationInboxItemProps) {
  const t = useTranslations('inbox');
  const meta = inboxMeta(item.type);
  const recordingDone = isRecordingCompleted(item);
  const action = !recordingDone && meta.action ? t(meta.action) : null;
  const letter = isLetterNotification(item.type);
  const title = recordingDone ? t('typeRecordingDone') : t(meta.titleKey);
  const detail = recordingDone ? t('recordingThankYou') : notificationDetail(item);

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          'flex w-full gap-3 rounded-2xl border bg-white p-4 text-left transition-colors sm:gap-4 sm:rounded-3xl sm:p-5',
          item.isRead || recordingDone
            ? 'border-[rgba(14,14,16,0.07)] hover:bg-[#fafafa]'
            : 'border-[#1010a3]/20 bg-[#1010a3]/[0.04] hover:bg-[#1010a3]/[0.07]',
        )}
      >
        <NotificationInboxIcon category={meta.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f6f6f7] px-2.5 py-0.5 text-[11px] font-medium text-[#5b5b62]">
              {t(`category.${meta.category}`)}
            </span>
            {!item.isRead && !recordingDone ? (
              <span className="rounded-full bg-[#1010a3] px-2 py-0.5 text-[11px] font-semibold text-white">
                {t('new')}
              </span>
            ) : null}
            <span className="ml-auto text-xs text-[#8b8b90]">{formatInboxTime(item.createdAt, locale)}</span>
          </div>
          <p className="mt-2 text-base font-semibold tracking-tight text-[#1010a3]">{title}</p>
          <p
            className={cn(
              'mt-1 text-sm leading-6 text-[#5b5b62]',
              letter ? 'whitespace-pre-line' : 'line-clamp-3',
            )}
          >
            {detail}
          </p>
          {recordingDone ? (
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0f7a3f]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f7ef]">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
              {t('recordingCompleted')}
            </span>
          ) : action ? (
            <span className="mt-3 inline-flex rounded-full bg-[#1010a3] px-3.5 py-1.5 text-sm font-medium text-white">
              {action}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
}
