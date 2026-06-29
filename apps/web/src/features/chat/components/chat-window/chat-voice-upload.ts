import { api } from '@/shared/lib/api';

export async function uploadChatVoiceFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadResponse = await api.post<{
    success: boolean;
    data: { url: string; fileName: string; fileSize: number };
  }>('/storage/chat', formData);

  if (!uploadResponse.success || !uploadResponse.data) {
    throw new Error('Voice upload failed');
  }

  const { url: fileUrl, fileName, fileSize } = uploadResponse.data;
  return { fileUrl, fileName, fileSize };
}
