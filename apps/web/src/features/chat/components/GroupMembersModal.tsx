'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  portalSheetLayerProps,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { cn } from '@/shared/lib/utils';
import {
  CUSTOM_MODAL_OVERLAY_CLASS,
  CUSTOM_MODAL_PANEL_CLASS,
} from '@/shared/lib/portal-form-sheet-classes';
import { getInitials } from '@/shared/components/ui/avatar';
import type { Chat, ChatParticipant } from '../types';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  currentUserId?: string;
}

function participantDisplayName(participant: ChatParticipant): string {
  const { firstName, lastName } = participant.user;
  return `${firstName} ${lastName}`.trim() || participant.user.id;
}

function roleTranslationKey(role: string): 'admin' | 'manager' | 'teacher' | 'student' | null {
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

export function GroupMembersModal({
  isOpen,
  onClose,
  chat,
  currentUserId,
}: GroupMembersModalProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const { contentStyle, isBaseLayer } = useSheetStackZIndex(isOpen);

  if (!isOpen) return null;

  const members = [...(chat.participants ?? [])].sort((a, b) =>
    participantDisplayName(a).localeCompare(participantDisplayName(b), undefined, {
      sensitivity: 'base',
    }),
  );

  return (
    <>
      <div
        className={stackedSheetOverlayClassName(CUSTOM_MODAL_OVERLAY_CLASS, isBaseLayer)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={contentStyle}
        {...portalSheetLayerProps}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-members-title"
        className={cn(CUSTOM_MODAL_PANEL_CLASS, 'mx-4 max-h-[80vh] max-w-md tablet:mx-0')}
      >
        <div className="border-b border-slate-200 p-4">
          <h3 id="group-members-title" className="text-lg font-semibold text-slate-800">
            {tChat('members')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tChat('participantsCount', { count: members.length })}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">{tChat('noGroupMembers')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((participant) => {
                const name = participantDisplayName(participant);
                const roleKey = roleTranslationKey(participant.user.role);
                const isYou = participant.userId === currentUserId;
                const roleLabel = roleKey ? tRoles(roleKey) : participant.user.role;

                return (
                  <li key={participant.userId} className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 font-medium text-primary">
                      {participant.user.avatarUrl ? (
                        <Image
                          src={participant.user.avatarUrl}
                          alt={name}
                          width={40}
                          height={40}
                          className="h-full w-full rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        getInitials(name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {name}
                        {isYou ? (
                          <span className="ml-1 font-normal text-slate-500">
                            ({tChat('you')})
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {roleLabel}
                        {participant.isAdmin ? ` · ${tChat('groupAdmin')}` : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {tCommon('close')}
          </button>
        </div>
      </div>
    </>
  );
}
