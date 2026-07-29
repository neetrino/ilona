'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  portalSheetLayerProps,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { useMessages } from '../hooks';
import type { Chat } from '../types';
import { GroupInfoTabBar } from './GroupInfoTabBar';
import { GroupInfoMembersPanel } from './GroupInfoMembersPanel';
import { GroupInfoSharedPanels } from './GroupInfoSharedPanels';
import {
  GROUP_INFO_PANEL_INNER_CLASS,
  extractLinkItems,
  filterVoiceMessages,
  flattenMessagePages,
  groupInfoPanelClassName,
  sortParticipants,
  type GroupInfoTab,
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
  /** Admin/Manager: tap a member to open/create their 1:1 chat */
  onMemberClick?: (userId: string) => void;
  isOpeningDirectChat?: boolean;
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
  onMemberClick,
  isOpeningDirectChat = false,
}: GroupMembersModalProps) {
  const tChat = useTranslations('chat');
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isOpen);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [activeTab, setActiveTab] = useState<GroupInfoTab>('members');

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    onClose,
    enabled: isMounted && isVisible,
  });

  const needsSharedData = isOpen && activeTab !== 'members';
  const { data: messagesData, isLoading: isMessagesLoading } = useMessages(
    chat.id,
    isOpen,
  );

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setIsVisible(false);
    resetDrag();
    const timeout = window.setTimeout(() => {
      setIsMounted(false);
      setActiveTab('members');
    }, 320);
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

  const members = sortParticipants(chat.participants ?? []);
  const messages = useMemo(
    () => flattenMessagePages(messagesData?.pages),
    [messagesData?.pages],
  );
  const voiceMessages = useMemo(() => filterVoiceMessages(messages), [messages]);
  const linkItems = useMemo(() => extractLinkItems(messages), [messages]);

  if (!isMounted) return null;

  const sharedLoading = needsSharedData && isMessagesLoading && messages.length === 0;

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

          <GroupInfoTabBar activeTab={activeTab} onChange={setActiveTab} />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] tablet:pb-4">
            {activeTab === 'members' ? (
              <GroupInfoMembersPanel
                chat={chat}
                currentUserId={currentUserId}
                onMemberClick={onMemberClick}
                isOpeningDirectChat={isOpeningDirectChat}
              />
            ) : (
              <GroupInfoSharedPanels
                activeTab={activeTab}
                voiceMessages={voiceMessages}
                linkItems={linkItems}
                isLoading={sharedLoading}
              />
            )}
          </div>

          {canAddMembers && onAddMembers && activeTab === 'members' ? (
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
