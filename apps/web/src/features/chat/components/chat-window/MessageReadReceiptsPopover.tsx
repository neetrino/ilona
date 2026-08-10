'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetOverlayClassName,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { formatDisplayName, getInitialsFromParts, formatTime } from '../../utils/chat-utils';
import type {
  MessageReadReceipt,
  MessageUnreadRecipient,
} from '../../utils/message-delivery-status';

interface MessageReadReceiptsPopoverProps {
  seen: MessageReadReceipt[];
  unseen: MessageUnreadRecipient[];
  onClose: () => void;
}

const RECEIPTS_SCROLL_CLASS = cn(
  'min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
  '[scrollbar-width:thin]',
  '[scrollbar-color:#1010a3_transparent]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-[#1010a3]/25',
  '[&::-webkit-scrollbar-thumb]:hover:bg-[#1010a3]/45',
  '[&::-webkit-scrollbar-button]:hidden',
);

function formatSeenAt(iso: string, locale: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = formatTime(iso, locale);
  return `${datePart} · ${timePart}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-white/90 px-3.5 pb-1.5 pt-2.5 backdrop-blur-[1px]">
      <p className="text-[11px] font-semibold tracking-wide text-[#1010a3]/75">{children}</p>
    </div>
  );
}

function RecipientRow({
  firstName,
  lastName,
  avatarUrl,
  subtitle,
  subtitleClassName,
  tone,
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  subtitle: string;
  subtitleClassName?: string;
  tone: 'seen' | 'unseen';
}) {
  const name = formatDisplayName(firstName, lastName) || '?';

  return (
    <li className="px-2.5">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors',
          tone === 'seen' ? 'hover:bg-[#f0f1ff]' : 'hover:bg-slate-50',
        )}
      >
        <div className="relative h-9 w-9 shrink-0">
          <div
            className={cn(
              'flex h-full w-full items-center justify-center overflow-hidden rounded-full text-xs font-semibold',
              tone === 'seen'
                ? 'bg-[#1010a3]/10 text-[#1010a3] ring-2 ring-[#1010a3]/10'
                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80',
            )}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              getInitialsFromParts(firstName, lastName)
            )}
          </div>
          {tone === 'seen' ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1010a3] text-white shadow-sm ring-2 ring-white">
              <svg className="h-2 w-2" viewBox="0 0 12 10" fill="none" aria-hidden>
                <path
                  d="M1 5.2L4.2 8.4L11 1.2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#3b3b40]">{name}</p>
          <p
            className={cn(
              'truncate text-[11px] leading-snug',
              tone === 'seen' ? 'text-[#1010a3]/70' : 'text-slate-400',
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </li>
  );
}

export function MessageReadReceiptsPopover({
  seen,
  unseen,
  onClose,
}: MessageReadReceiptsPopoverProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        style={overlayStyle}
        {...portalSheetLayerProps}
        className={stackedSheetOverlayClassName(
          'fixed inset-0 z-50 bg-black/40 tablet:bg-black/50',
          isBaseLayer,
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tChat('messageReadReceiptsTitle')}
        style={contentStyle}
        {...portalSheetLayerProps}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,80dvh)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_12px_40px_rgba(16,16,163,0.12),0_4px_16px_rgba(0,0,0,0.06)]',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-[rgba(14,14,16,0.06)] bg-gradient-to-br from-[#f5f5ff] via-white to-white px-3.5 pb-3 pt-3">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1010a3] text-white shadow-sm shadow-[#1010a3]/25">
              <svg className="h-4 w-4" viewBox="0 0 16 11" fill="none" aria-hidden>
                <path
                  d="M1.1 5.8L3.8 8.5L9.2 1.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.4 6.2L7.4 8.5L13.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-[#1010a3]">
                {tChat('messageReadReceiptsTitle')}
              </p>
              <p className="text-[11px] text-slate-500">
                {tChat('seenByCount', { count: seen.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(ADMIN_ICON_BUTTON_SM_CLASS, 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={RECEIPTS_SCROLL_CLASS}>
          <SectionLabel>{tChat('seenByCount', { count: seen.length })}</SectionLabel>
          {seen.length === 0 ? (
            <p className="px-3.5 pb-3 text-sm leading-relaxed text-slate-500">
              {tChat('noOneSeenYet')}
            </p>
          ) : (
            <ul className="space-y-0.5 pb-1">
              {seen.map((person) => (
                <RecipientRow
                  key={person.userId}
                  firstName={person.firstName}
                  lastName={person.lastName}
                  avatarUrl={person.avatarUrl}
                  subtitle={formatSeenAt(person.readAt, locale)}
                  tone="seen"
                />
              ))}
            </ul>
          )}

          {unseen.length > 0 ? (
            <>
              <div className="mx-3.5 border-t border-[rgba(14,14,16,0.06)]" />
              <SectionLabel>{tChat('notSeenYetCount', { count: unseen.length })}</SectionLabel>
              <ul className="space-y-0.5 pb-2">
                {unseen.map((person) => (
                  <RecipientRow
                    key={person.userId}
                    firstName={person.firstName}
                    lastName={person.lastName}
                    avatarUrl={person.avatarUrl}
                    subtitle={tChat('notSeenYet')}
                    tone="unseen"
                  />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
