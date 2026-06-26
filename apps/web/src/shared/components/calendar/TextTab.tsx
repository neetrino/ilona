'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson } from '@/features/lessons';
import { fetchGroupChat, sendMessageHttp } from '@/features/chat/api/chat.api';
import { api } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { Button } from '@/shared/components/ui/button';

interface TextTabProps {
  lessonId: string;
}

export function TextTab({ lessonId }: TextTabProps) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#1010a3]"></div>
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
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          {lesson.textSent ? tChat('editTextMessage') : tChat('sendTextMessage')}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {lesson.textSent ? tChat('textReplaceHint') : tChat('textWriteHint')}
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10"
          placeholder={tChat('enterMessagePlaceholder')}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={isSending || !text.trim()}
            className="bg-[#1010a3] px-6 py-2 text-white hover:bg-[#0d0d85]"
          >
            {isSending ? tChat('sendingMessage') : tChat('sendMessageButton')}
          </Button>
        </div>
      </div>

      {lesson.textSent && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ {tChat('textSentConfirmation')}
          </p>
        </div>
      )}
    </div>
  );
}
