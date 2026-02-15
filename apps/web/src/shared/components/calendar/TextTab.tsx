'use client';

import { useState } from 'react';
import { useLesson } from '@/features/lessons';
import { fetchGroupChat, sendMessageHttp } from '@/features/chat/api/chat.api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { Button } from '@/shared/components/ui/button';

interface TextTabProps {
  lessonId: string;
}

export function TextTab({ lessonId }: TextTabProps) {
  const queryClient = useQueryClient();
  const { data: lesson, isLoading } = useLesson(lessonId);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }

    if (!lesson || !lesson.group) {
      alert('Lesson or group not found');
      return;
    }

    setIsSending(true);

    try {
      // Get group chat
      const chat = await fetchGroupChat(lesson.group.id);

      // Send message to group chat with lesson metadata
      await sendMessageHttp(chat.id, text.trim(), 'TEXT', {
        metadata: {
          lessonId: lesson.id,
          fromLessonDetail: true,
        },
      });

      // Invalidate lesson query to refresh data
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });

      setText('');
      alert('Text message sent successfully!');
    } catch (error) {
      console.error('Failed to send text message:', error);
      alert('Failed to send text message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lesson || !lesson.group) {
    return (
      <div className="p-6 text-center text-slate-500">
        Lesson or group not found
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Send Text Message</h3>
        <p className="text-sm text-slate-500 mt-1">
          Write a text message that will be sent to the group chat
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your message here..."
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={isSending || !text.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>

      {lesson.textSent && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Text message has been sent to the group chat
          </p>
        </div>
      )}
    </div>
  );
}







