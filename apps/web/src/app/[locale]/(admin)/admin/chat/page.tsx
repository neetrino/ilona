'use client';

import { useTranslations } from 'next-intl';
import { AdminChatContainer } from '@/features/chat';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function AdminChatPage() {
  const tNav = useTranslations('nav');
  const tChat = useTranslations('chat');

  return (
    <DashboardLayout title={tNav('chat')} mobileFullBleed>
      <AdminChatContainer
        className="min-h-0 flex-1 rounded-none border-0 bg-white lg:rounded-2xl lg:border lg:border-slate-200"
        emptyTitle={tChat('selectChat')}
        emptyDescription={tChat('selectChatDescription')}
      />
    </DashboardLayout>
  );
}
