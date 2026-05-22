'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { CrmLeadStatus } from '@/features/crm/types';

export function useCrmStatusLabels(): Record<CrmLeadStatus, string> {
  const t = useTranslations('crm');

  return useMemo(
    () => ({
      NEW: t('statusNew'),
      FIRST_LESSON: t('statusFirstLesson'),
      PAID: t('statusPaid'),
      WAITLIST: t('statusWaitlist'),
      ARCHIVE: t('statusArchive'),
    }),
    [t],
  );
}
