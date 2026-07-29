'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
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

function formatSeenAt(iso: string, locale: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = formatTime(iso, locale);
  return `${datePart}, ${timePart}`;
}

function RecipientRow({
  firstName,
  lastName,
  avatarUrl,
  subtitle,
  subtitleClassName,
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  subtitle: string;
  subtitleClassName?: string;
}) {
  const name = formatDisplayName(firstName, lastName) || '?';

  return (
    <li className="flex items-center gap-2.5 px-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1010a3]/10 text-xs font-medium text-[#1010a3]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={32}
            height={32}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          getInitialsFromParts(firstName, lastName)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{name}</p>
        <p className={cn('truncate text-xs text-slate-500', subtitleClassName)}>{subtitle}</p>
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
  const locale = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={tChat('messageReadReceiptsTitle')}
      className="absolute bottom-full right-0 z-30 mb-1 w-64 overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1010a3]">
          {tChat('messageReadReceiptsTitle')}
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <div className="px-3 pb-1 pt-2">
          <p className="text-[11px] font-medium text-slate-500">
            {tChat('seenByCount', { count: seen.length })}
          </p>
        </div>
        {seen.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-slate-500">{tChat('noOneSeenYet')}</p>
        ) : (
          <ul>
            {seen.map((person) => (
              <RecipientRow
                key={person.userId}
                firstName={person.firstName}
                lastName={person.lastName}
                avatarUrl={person.avatarUrl}
                subtitle={formatSeenAt(person.readAt, locale)}
              />
            ))}
          </ul>
        )}

        {unseen.length > 0 ? (
          <>
            <div className="border-t border-slate-100 px-3 pb-1 pt-2">
              <p className="text-[11px] font-medium text-slate-500">
                {tChat('notSeenYetCount', { count: unseen.length })}
              </p>
            </div>
            <ul className="pb-1">
              {unseen.map((person) => (
                <RecipientRow
                  key={person.userId}
                  firstName={person.firstName}
                  lastName={person.lastName}
                  avatarUrl={person.avatarUrl}
                  subtitle={tChat('notSeenYet')}
                  subtitleClassName="italic"
                />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
