'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { ChatThemeTokens } from '../../lib/chat-theme';
import { isPortalChatRole } from '../../lib/chat-theme';
import { VoiceRecorder } from '../VoiceRecorder';

interface ChatComposerProps {
  chatId: string;
  ui: ChatThemeTokens;
  userRole?: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  inputValue: string;
  placeholderKey: string;
  isMobileConversation: boolean;
  needsMobileBottomNavComposerOffset: boolean;
  useMobileComposerSizing: boolean;
  mobileComposerBtnClass: string;
  mobileComposerInputClass: string;
  isStudent: boolean;
  canSendVoiceToTeacher: boolean;
  showVoiceRecorder: boolean;
  showVoiceToTeacherRecorder: boolean;
  isUploadingVoice: boolean;
  isUploadingVoiceToTeacher: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onStartVoiceRecorder: () => void;
  onCancelVoiceRecorder: () => void;
  onVoiceRecorded: (file: File, durationSec: number, mimeType: string) => void;
  onStartVoiceToTeacherRecorder: () => void;
  onCancelVoiceToTeacherRecorder: () => void;
  onVoiceToTeacherRecorded: (file: File, durationSec: number, mimeType: string) => void;
}

export function ChatComposer({
  chatId,
  ui,
  userRole,
  inputRef,
  inputValue,
  placeholderKey,
  isMobileConversation,
  needsMobileBottomNavComposerOffset,
  useMobileComposerSizing,
  mobileComposerBtnClass,
  mobileComposerInputClass,
  isStudent,
  canSendVoiceToTeacher,
  showVoiceRecorder,
  showVoiceToTeacherRecorder,
  isUploadingVoice,
  isUploadingVoiceToTeacher,
  onInputChange,
  onKeyDown,
  onSend,
  onStartVoiceRecorder,
  onCancelVoiceRecorder,
  onVoiceRecorded,
  onStartVoiceToTeacherRecorder,
  onCancelVoiceToTeacherRecorder,
  onVoiceToTeacherRecorded,
}: ChatComposerProps) {
  const tChat = useTranslations('chat');
  const voiceVariant = isPortalChatRole(userRole) ? 'student' : 'default';

  return (
    <div
      className={cn(
        'shrink-0 border-t p-4',
        isMobileConversation && 'max-lg:sticky max-lg:bottom-0 max-lg:z-20',
        needsMobileBottomNavComposerOffset &&
          'max-lg:pb-[calc(6rem+env(safe-area-inset-bottom))]',
        isMobileConversation &&
          !needsMobileBottomNavComposerOffset &&
          'max-lg:pb-[env(safe-area-inset-bottom)]',
        ui.border,
        ui.headerBg,
      )}
    >
      {showVoiceRecorder ? (
        <div className="space-y-2">
          <VoiceRecorder
            variant={voiceVariant}
            onRecorded={onVoiceRecorded}
            onCancel={onCancelVoiceRecorder}
            conversationId={chatId}
          />
          {isUploadingVoice && (
            <p className={cn('text-center text-sm', ui.muted)}>{tChat('uploadingVoice')}</p>
          )}
        </div>
      ) : showVoiceToTeacherRecorder ? (
        <div className="space-y-2">
          <p className={cn('text-sm font-medium', ui.body)}>{tChat('recordingForTeacher')}</p>
          <VoiceRecorder
            variant={voiceVariant}
            onRecorded={onVoiceToTeacherRecorded}
            onCancel={onCancelVoiceToTeacherRecorder}
            conversationId={chatId}
          />
          {isUploadingVoiceToTeacher && (
            <p className={cn('text-center text-sm', ui.muted)}>{tChat('sendingVoiceToTeacher')}</p>
          )}
        </div>
      ) : (
        <div className={cn('flex gap-2', useMobileComposerSizing ? 'items-center' : 'items-end')}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={tChat(placeholderKey)}
            rows={1}
            className={cn(ui.input, mobileComposerInputClass)}
            style={useMobileComposerSizing ? undefined : { minHeight: '40px' }}
          />

          <button
            type="button"
            onClick={onStartVoiceRecorder}
            className={cn(mobileComposerBtnClass, 'transition-colors', ui.ghostBtn)}
            title={tChat('recordVoiceMessage')}
            aria-label={tChat('recordVoiceMessage')}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>

          {isStudent && canSendVoiceToTeacher && (
            <button
              type="button"
              onClick={onStartVoiceToTeacherRecorder}
              className={
                useMobileComposerSizing
                  ? cn(
                      mobileComposerBtnClass,
                      'border border-amber-200 bg-amber-100 text-amber-800 transition-colors hover:bg-amber-200',
                    )
                  : 'flex flex-shrink-0 items-center gap-1.5 rounded-[0.875rem] border border-amber-200 bg-amber-100 px-2.5 py-2 text-amber-800 transition-colors hover:bg-amber-200'
              }
              title={tChat('sendVoiceToTeacherTitle')}
              aria-label={tChat('sendVoiceToTeacherTitle')}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              <span className="hidden text-xs font-medium sm:inline">
                {tChat('sendVoiceToTeacherShort')}
              </span>
            </button>
          )}

          <button
            onClick={onSend}
            disabled={!inputValue.trim()}
            className={cn(
              mobileComposerBtnClass,
              'transition-colors',
              inputValue.trim() ? ui.primaryBtn : ui.primaryBtnDisabled,
            )}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
