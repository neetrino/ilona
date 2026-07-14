'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { formatDisplayName, getInitialsFromParts } from '@/shared/components/ui/avatar';
import { formatChatListPreview } from '../../utils';
import { OnlineStatusDot } from '../OnlineStatusDot';
import type { TeacherChatListViewModel } from './teacher-chat-list.types';

interface TeacherChatListStudentItemsProps {
  students: TeacherChatListViewModel['sortedStudents'];
  activeChat: TeacherChatListViewModel['activeChat'];
  createDirectChatPending: boolean;
  messagePreviewLabels: TeacherChatListViewModel['messagePreviewLabels'];
  formatTime: TeacherChatListViewModel['formatTime'];
  isUserOnline: TeacherChatListViewModel['isUserOnline'];
  onStudentClick: TeacherChatListViewModel['handleStudentClick'];
}

export function TeacherChatListStudentItems({
  students,
  activeChat,
  createDirectChatPending,
  messagePreviewLabels,
  formatTime,
  isUserOnline,
  onStudentClick,
}: TeacherChatListStudentItemsProps) {
  const tChat = useTranslations('chat');

  return (
    <>
      {students.map((student) => {
        const isActive = activeChat?.id === student.chatId;
        const hasUnread = (student.unreadCount || 0) > 0;
        const isOnline = student.chatId ? isUserOnline(student.chatId, student.id) : false;
        const studentName = formatDisplayName(student.firstName, student.lastName);
        const initials = getInitialsFromParts(student.firstName, student.lastName);

        return (
          <button
            key={student.id}
            onClick={() => onStudentClick(student.id, student.chatId)}
            disabled={createDirectChatPending}
            className={cn(
              'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50',
              isActive && 'bg-primary/10 hover:bg-primary/10',
              createDirectChatPending && 'cursor-not-allowed opacity-50',
            )}
          >
            <div className="relative">
              {student.avatarUrl ? (
                <Image
                  src={student.avatarUrl}
                  alt={studentName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-white">
                  {initials}
                </div>
              )}
              <OnlineStatusDot isOnline={isOnline} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <h3
                  className={cn(
                    'truncate font-medium',
                    hasUnread ? 'text-slate-900' : 'text-slate-700',
                  )}
                >
                  {studentName}
                </h3>
                {student.chatId && (
                  <span className="flex-shrink-0 text-xs text-slate-500">
                    {formatTime(student.lastMessage?.createdAt || student.updatedAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                {student.chatId ? (
                  <>
                    <p
                      className={cn(
                        'truncate text-sm',
                        hasUnread ? 'font-medium text-slate-700' : 'text-slate-500',
                      )}
                    >
                      {formatChatListPreview({
                        message: student.lastMessage,
                        labels: messagePreviewLabels,
                        unreadCount: student.unreadCount || 0,
                        unreadLabel: hasUnread
                          ? tChat('unreadCount', { count: student.unreadCount || 0 })
                          : undefined,
                      })}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                        {student.unreadCount}
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-sm italic text-slate-500">{tChat('clickToStartConversation')}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}
