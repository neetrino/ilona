'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLesson } from '@/features/lessons';
import { VoiceRecorder } from '@/features/chat/components/VoiceRecorder';
import { fetchGroupChat, sendMessageHttp } from '@/features/chat/api/chat.api';
import { api } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface VoiceTabProps {
  lessonId: string;
}

export function VoiceTab({ lessonId }: VoiceTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: lesson, isLoading } = useLesson(lessonId);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleRecorded = async (file: File, durationSec: number, mimeType: string) => {
    if (!lesson || !lesson.group) {
      alert('Lesson or group not found');
      return;
    }

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
      const messageResponse = await sendMessageHttp(chat.id, '', 'VOICE', {
        fileUrl,
        fileName,
        fileSize,
        duration: durationSec,
        metadata: {
          lessonId: lesson.id,
          fromLessonDetail: true,
        },
      });

      // Invalidate lesson query to refresh data
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });

      // Navigate to chat if navigation metadata is available
      if (messageResponse.navigation?.conversationId) {
        // Extract locale from pathname (e.g., /en/admin/calendar -> en)
        const localeMatch = pathname.match(/^\/([^/]+)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        
        // Determine chat route based on user role
        const role = user?.role?.toLowerCase() || 'admin';
        const chatRoute = `/${locale}/${role}/chat?conversationId=${messageResponse.navigation.conversationId}`;
        
        router.push(chatRoute);
      } else {
        // Fallback: show success message if navigation metadata is not available
        alert('Voice message sent successfully!');
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Failed to send voice message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send voice message. Please try again.';
      
      // Check if it's a permission error
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('not authorized')) {
        alert('Voice message sent, but we couldn\'t open chat automatically. Please open chat manually.');
      } else {
        alert(errorMessage);
      }
    } finally {
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Record Voice Message</h3>
        <p className="text-sm text-slate-500 mt-1">
          Record a voice message that will be sent to the group chat
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

