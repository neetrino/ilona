'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  portalSheetLayerProps,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { cn } from '@/shared/lib/utils';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { getInitials } from '@/shared/components/ui/avatar';
import { useChatStore } from '../store/chat.store';
import { formatChatLastSeen } from '../utils/chat-last-seen';
import type { Chat } from '../types';
import {
  GROUP_INFO_PANEL_INNER_CLASS,
  groupInfoPanelClassName,
  participantDisplayName,
  rolePillClass,
  roleTranslationKey,
  sortParticipants,
} from './group-members-modal.util';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  title: string;
  avatarInitials: string;
  currentUserId?: string;
  canAddMembers?: boolean;
  onAddMembers?: () => void;
}

export function GroupMembersModal({
  isOpen,
  onClose,
  chat,
  title,
  avatarInitials,
  currentUserId,
  canAddMembers = false,
  onAddMembers,
}: GroupMembersModalProps) {
  const tChat = useTranslations('chat');
  const tRoles = useTranslations('roles');
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isOpen);
  const presenceByUserId = useChatStore((state) => state.presenceByUserId);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    onClose,
    enabled: isMounted && isVisible,
  });

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setIsVisible(false);
    resetDrag();
    const timeout = window.setTimeout(() => setIsMounted(false), 320);
    return () => window.clearTimeout(timeout);
  }, [isOpen, resetDrag]);

  useEffect(() => {
    if (!isMounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isMounted, onClose]);

  if (!isMounted) return null;

  const members = sortParticipants(chat.participants ?? []);

  return (
    <>
      <button
        type="button"
        className={stackedSheetOverlayClassName(
          'fixed inset-0 z-50 bg-black/45 transition-opacity duration-300 ease-out',
          isBaseLayer,
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={overlayStyle}
        aria-label={tChat('closeSheet')}
        onClick={onClose}
      />

      <div
        ref={scrollContentProps.ref}
        style={{ ...contentStyle, ...(dragStyle ?? {}) }}
        {...portalSheetLayerProps}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-info-title"
        className={groupInfoPanelClassName(isVisible, Boolean(dragStyle))}
      >
        <div className={GROUP_INFO_PANEL_INNER_CLASS}>
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

          <div className="relative flex shrink-0 items-center justify-center px-4 pb-2 tablet:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label={tChat('closeSheet')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 id="group-info-title" className="text-base font-semibold text-slate-900">
              {tChat('groupInfo')}
            </h2>
          </div>

          <div className="flex shrink-0 flex-col items-center px-4 pb-4 pt-1">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-2xl font-semibold text-white shadow-sm">
              {avatarInitials}
            </div>
            <p className="max-w-full truncate text-center text-xl font-semibold text-slate-900">
              {title}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {tChat('participantsCount', { count: members.length })}
            </p>
          </div>

          <div className="mx-4 mb-2 flex shrink-0 items-center rounded-xl bg-slate-50 px-1 py-1">
            <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700">
              {tChat('members')}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] tablet:pb-4">
            {members.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-500">{tChat('noGroupMembers')}</p>
              </div>
            ) : (
              <ul>
                {members.map((participant) => {
                  const name = participantDisplayName(participant);
                  const roleKey = roleTranslationKey(participant.user.role);
                  const isYou = participant.userId === currentUserId;
                  const presence = presenceByUserId[participant.userId];
                  const isOnline = Boolean(presence?.isOnline);
                  const statusLabel = formatChatLastSeen(
                    isOnline,
                    presence?.lastSeenAt ?? participant.user.lastSeenAt,
                    (key, values) => (values ? tChat(key, values) : tChat(key)),
                  );
                  const pillLabel = roleKey ? tRoles(roleKey) : participant.user.role;

                  return (
                    <li
                      key={participant.userId}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-medium text-primary">
                        {participant.user.avatarUrl ? (
                          <Image
                            src={participant.user.avatarUrl}
                            alt={name}
                            width={44}
                            height={44}
                            className="h-full w-full rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          getInitials(name)
                        )}
                        {isOnline ? (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {name}
                          {isYou ? (
                            <span className="ml-1 font-normal text-slate-400">
                              ({tChat('you')})
                            </span>
                          ) : null}
                        </p>
                        <p
                          className={cn(
                            'truncate text-xs',
                            isOnline ? 'text-emerald-600' : 'text-slate-500',
                          )}
                        >
                          {statusLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                          rolePillClass(participant.user.role),
                        )}
                      >
                        {pillLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {canAddMembers && onAddMembers ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddMembers();
              }}
              className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#6c5ce7] text-white shadow-lg transition hover:bg-[#5b4bd6] tablet:bottom-6"
              aria-label={tChat('addMembers')}
              title={tChat('addMembers')}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3z"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
