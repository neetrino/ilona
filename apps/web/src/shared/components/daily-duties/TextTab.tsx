'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson } from '@/features/lessons';
import { fetchGroupChat, sendMessageHttp } from '@/features/chat/api/chat.api';
import { api } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { Button } from '@/shared/components/ui/button';
import { DAILY_DUTIES_RADIUS_CLASS } from '@/shared/lib/daily-duties/daily-duties-theme';
import { ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import { LessonDetailTabSectionHeader } from '@/shared/components/daily-duties/LessonDetailTabSectionHeader';
import { lessonDetailTabShellClass } from '@/shared/components/daily-duties/lesson-detail-tab-layout';
import { cn } from '@/shared/lib/utils';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

interface TextTabProps {
  lessonId: string;
  embeddedInSheet?: boolean;
}

export function TextTab({ lessonId, embeddedInSheet = false }: TextTabProps) {
  const tChat = useTranslations('chat');
  const queryClient = useQueryClient();
  const { data: lesson, isLoading } = useLesson(lessonId);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) {
      alert(tChat('textEnterRequired'));
      return;
    }

    if (!lesson || !lesson.group) {
      alert(tChat('lessonOrGroupNotFound'));
      return;
    }

    setIsSending(true);

    try {
      const chat = await fetchGroupChat(lesson.group.id);

      await sendMessageHttp(chat.id, text.trim(), 'TEXT', {
        metadata: {
          lessonId: lesson.id,
          fromLessonDetail: true,
        },
      });

      await api.patch(`/lessons/${lesson.id}/text-sent`);
      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });

      setText('');
      alert(tChat('textSentSuccess'));
    } catch (error) {
      console.error('Failed to send text message:', error);
      alert(tChat('textSendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const textTitle = lesson?.textSent ? tChat('editTextMessage') : tChat('sendTextMessage');
  const textSubtitle = lesson?.textSent ? tChat('textReplaceHint') : tChat('textWriteHint');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!lesson || !lesson.group) {
    return (
      <div className="p-6 text-center text-slate-500">
        {tChat('lessonOrGroupNotFound')}
      </div>
    );
  }

  return (
    <div className={lessonDetailTabShellClass(embeddedInSheet)}>
      <LessonDetailTabSectionHeader
        title={textTitle}
        embeddedInSheet={embeddedInSheet}
        subtitle={embeddedInSheet ? undefined : textSubtitle}
      />

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className={cn(
            'w-full border border-slate-300 px-4 py-3 focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10',
            DAILY_DUTIES_RADIUS_CLASS,
          )}
          placeholder={tChat('enterMessagePlaceholder')}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={isSending || !text.trim()}
            className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-[#1010a3] px-6 py-2 text-white hover:bg-[#0d0d85]')}
          >
            {isSending ? tChat('sendingMessage') : tChat('sendMessageButton')}
          </Button>
        </div>
      </div>

      {lesson.textSent && (
        <div className={cn('mt-6 border border-green-200 bg-green-50 p-4', DAILY_DUTIES_RADIUS_CLASS)}>
          <p className="text-sm text-green-700">
            ✓ {tChat('textSentConfirmation')}
          </p>
        </div>
      )}
    </div>
  );
}

