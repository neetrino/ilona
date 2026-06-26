'use client';

import { useRef, useState } from 'react';
import { useRouter, usePathname } from '@/config/navigation';
import { useLesson } from '@/features/lessons';
import { VoiceRecorder } from '@/features/chat/components/VoiceRecorder';
import { fetchGroupChat, sendMessageHttp } from '@/features/chat/api/chat.api';
import { buildPortalChatHref } from '@/features/chat/lib/navigate-to-portal-chat';
import { useAddMessageToCache, chatKeys } from '@/features/chat/hooks';
import { useChatStore } from '@/features/chat/store/chat.store';
import { api } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { Button } from '@/shared/components/ui/button';
import { AutoDismissToast } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface VoiceTabProps {
  lessonId: string;
}

export function VoiceTab({ lessonId }: VoiceTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addMessageToCache = useAddMessageToCache();
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const setMobileListVisible = useChatStore((state) => state.setMobileListVisible);
  const { data: lesson, isLoading } = useLesson(lessonId);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ key: number; message: string; variant: 'success' | 'error' } | null>(null);
  const sendInFlightRef = useRef(false);

  const handleRecorded = async (file: File, durationSec: number, _mimeType: string) => {
    if (sendInFlightRef.current) return;

    if (!lesson || !lesson.group) {
      throw new Error('Lesson or group not found');
    }

    sendInFlightRef.current = true;
    setIsUploading(true);

    try {
      // Get group chat
      const chat = await fetchGroupChat(lesson.group.id);

      // Upload file to R2
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post<{ success: boolean; data: { url: string; fileName: string; fileSize: number } }>(
        '/storage/chat',
        formData
      );

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('Failed to upload file');
      }

      const { url: fileUrl, fileName, fileSize } = uploadResponse.data;

      // Send message to group chat with lesson metadata
      const isLessonSubstitute =
        !!lesson.substituteTeacher?.user?.id && lesson.substituteTeacher.user.id === user?.id;

      const message = await sendMessageHttp(chat.id, '', 'VOICE', {
        fileUrl,
        fileName,
        fileSize,
        duration: durationSec,
        metadata: {
          lessonId: lesson.id,
          fromLessonDetail: true,
          ...(isLessonSubstitute
            ? {
                sentAsSubstitute: true,
                substituteLabel: 'Substitute teacher',
              }
            : {}),
        },
      });

      addMessageToCache(chat.id, message);
      queryClient.setQueryData(chatKeys.detail(chat.id), {
        ...chat,
        lastMessage: message,
        lastMessageAt: message.createdAt,
      });
      setActiveChat(chat);
      setMobileListVisible(false);

      // Mark voice as sent and invalidate both detail and list queries to ensure consistency
      await api.patch(`/lessons/${lesson.id}/voice-sent`);
      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });

      setIsRecording(false);
      setToast({
        key: Date.now(),
        message: 'Voice message has been sent to the group chat',
        variant: 'success',
      });

      if (user?.role) {
        router.push(
          buildPortalChatHref(user.role, {
            conversationId: chat.id,
            returnTo: pathname,
            tab: user.role === 'ADMIN' || user.role === 'MANAGER' ? 'groups' : undefined,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to send voice message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send voice message. Please try again.';

      if (
        errorMessage.includes('403') ||
        errorMessage.includes('Forbidden') ||
        errorMessage.includes('not authorized')
      ) {
        setToast({
          key: Date.now(),
          message: 'Voice message sent, but we could not open chat automatically.',
          variant: 'success',
        });
        setIsRecording(false);
        return;
      }

      setToast({
        key: Date.now(),
        message: errorMessage,
        variant: 'error',
      });
      throw error;
    } finally {
      sendInFlightRef.current = false;
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsRecording(false);
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
      {toast ? (
        <AutoDismissToast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          {lesson.voiceSent ? 'Edit Voice Message' : 'Record Voice Message'}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {lesson.voiceSent
            ? 'Record a new voice message to replace the existing one'
            : 'Record a voice message that will be sent to the group chat'}
        </p>
      </div>

      {!isRecording ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-lg">
          <Button
            onClick={() => setIsRecording(true)}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            {isUploading ? 'Uploading...' : 'Start Recording'}
          </Button>
        </div>
      ) : (
        <VoiceRecorder
          onRecorded={handleRecorded}
          onCancel={handleCancel}
          conversationId={lesson.group.id}
        />
      )}

      {lesson.voiceSent && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Voice message has been sent to the group chat
          </p>
        </div>
      )}
    </div>
  );
}

