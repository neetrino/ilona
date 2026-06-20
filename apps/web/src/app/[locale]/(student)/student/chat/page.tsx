'use client';

import { useTranslations } from 'next-intl';
import { ChatContainer } from '@/features/chat';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function StudentChatPage() {
  const tNav = useTranslations('nav');
  const tChat = useTranslations('chat');

  return (
    <DashboardLayout title={tNav('chat')}>
      <ChatContainer
        emptyTitle={tChat('selectChat')}
        emptyDescription={tChat('selectChatWithVocabulary')}
      />
    </DashboardLayout>
  );
}
