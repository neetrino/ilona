'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { getInitials } from '@/shared/components/ui/avatar';
import { useChatStore } from '../store/chat.store';
import { formatChatLastSeen } from '../utils/chat-last-seen';
import type { Chat } from '../types';
import {
  participantDisplayName,
  rolePillClass,
  roleTranslationKey,
  sortParticipants,
} from './group-members-modal.util';

interface GroupInfoMembersPanelProps {
  chat: Chat;
  currentUserId?: string;
}

export function GroupInfoMembersPanel({ chat, currentUserId }: GroupInfoMembersPanelProps) {
  const tChat = useTranslations('chat');
  const tRoles = useTranslations('roles');
  const presenceByUserId = useChatStore((state) => state.presenceByUserId);
  const members = sortParticipants(chat.participants ?? []);

  if (members.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-slate-500">{tChat('noGroupMembers')}</p>
      </div>
    );
  }

  return (
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
          <li key={participant.userId} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="relative h-11 w-11 shrink-0">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-medium text-primary">
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
              </div>
              {isOnline ? (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {name}
                {isYou ? (
                  <span className="ml-1 font-normal text-slate-400">({tChat('you')})</span>
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
  );
}
