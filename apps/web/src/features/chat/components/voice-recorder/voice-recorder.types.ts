import type { ChatUiVariant } from '../../lib/chat-theme';

export interface VoiceRecorderProps {
  variant?: ChatUiVariant;
  /** Use 15px corners on recorder controls (daily-duties voice tab). */
  buttonRadius?: 'default' | '15px';
  onRecorded: (file: File, durationSec: number, mimeType: string) => void | Promise<void>;
  onCancel: () => void;
  conversationId: string;
}

export interface VoiceRecorderViewModel {
  ui: ReturnType<typeof import('../../lib/chat-theme').getChatTheme>;
  isRecording: boolean;
  durationSec: number;
  previewUrl: string | null;
  recordedBlob: Blob | null;
  error: string | null;
  canSend: boolean;
  isSending: boolean;
  micLevel: number;
  micWarning: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleSend: () => Promise<void>;
  onCancel: () => void;
  formatDuration: (seconds: number) => string;
  setError: (message: string) => void;
}
