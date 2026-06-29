import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { sendMessageHttp } from '../../api/chat.api';
import type { Chat, Message } from '../../types';
import { uploadChatVoiceFile } from './chat-voice-upload';

interface UseChatVoiceHandlersOptions {
  chat: Chat;
  teacherUserIdForVoice: string | null;
  otherParticipantUserId?: string;
  addMessageToCache: (chatId: string, message: Message) => void;
  createDirectChat: { mutateAsync: (userId: string) => Promise<{ id: string }> };
}

export function useChatVoiceHandlers({
  chat,
  teacherUserIdForVoice,
  otherParticipantUserId,
  addMessageToCache,
  createDirectChat,
}: UseChatVoiceHandlersOptions) {
  const tChat = useTranslations('chat');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVoiceToTeacherRecorder, setShowVoiceToTeacherRecorder] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingVoiceToTeacher, setIsUploadingVoiceToTeacher] = useState(false);

  useEffect(() => {
    setShowVoiceRecorder(false);
    setShowVoiceToTeacherRecorder(false);
  }, [chat.id]);

  const handleVoiceRecorded = useCallback(
    async (file: File, durationSec: number, _mimeType: string) => {
      setIsUploadingVoice(true);
      try {
        const { fileUrl, fileName, fileSize } = await uploadChatVoiceFile(file);
        const message = await sendMessageHttp(chat.id, '', 'VOICE', {
          fileUrl,
          fileName,
          fileSize,
          duration: durationSec,
        });
        addMessageToCache(chat.id, message);
        setShowVoiceRecorder(false);
      } catch (error) {
        console.error('Failed to send voice message:', error);
        const msg = error instanceof Error ? error.message : tChat('sendVoiceFailed');
        alert(msg);
      } finally {
        setIsUploadingVoice(false);
      }
    },
    [chat.id, addMessageToCache, tChat],
  );

  const handleVoiceToTeacherRecorded = useCallback(
    async (file: File, durationSec: number, _mimeType: string) => {
      if (!teacherUserIdForVoice) return;
      setIsUploadingVoiceToTeacher(true);
      try {
        const { fileUrl, fileName, fileSize } = await uploadChatVoiceFile(file);

        let targetChatId: string;
        if (chat.type === 'DIRECT' && otherParticipantUserId === teacherUserIdForVoice) {
          targetChatId = chat.id;
        } else {
          const dmChat = await createDirectChat.mutateAsync(teacherUserIdForVoice);
          targetChatId = dmChat.id;
        }

        const message = await sendMessageHttp(targetChatId, '', 'VOICE', {
          fileUrl,
          fileName,
          fileSize,
          duration: durationSec,
          metadata: { voiceToTeacher: true, teacherId: teacherUserIdForVoice },
        });

        addMessageToCache(targetChatId, message);
        setShowVoiceToTeacherRecorder(false);
      } catch (error) {
        console.error('Failed to send voice to teacher:', error);
        const msg = error instanceof Error ? error.message : tChat('sendVoiceToTeacherFailed');
        alert(msg);
      } finally {
        setIsUploadingVoiceToTeacher(false);
      }
    },
    [
      teacherUserIdForVoice,
      chat.type,
      chat.id,
      otherParticipantUserId,
      createDirectChat,
      addMessageToCache,
      tChat,
    ],
  );

  return {
    showVoiceRecorder,
    setShowVoiceRecorder,
    showVoiceToTeacherRecorder,
    setShowVoiceToTeacherRecorder,
    isUploadingVoice,
    isUploadingVoiceToTeacher,
    handleVoiceRecorded,
    handleVoiceToTeacherRecorded,
  };
}
