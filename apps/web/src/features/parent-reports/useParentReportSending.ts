'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { sendParentQuarter, sendParentReport } from './api';

type Notice = { key: number; message: string; variant: 'success' | 'error' };

export function useParentReportSending(quarterKey: string | undefined, onSent: () => void) {
  const t = useTranslations('parentReportsPage');
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['parent-reports'] });
  const dismissNotice = useCallback(() => setNotice(null), []);

  const sendOne = useMutation({
    mutationFn: (studentId: string) => sendParentReport(studentId, quarterKey ?? ''),
    onSuccess: (result) => {
      refresh();
      onSent();
      setNotice(resultNotice(result.sent ? t('sentOne') : t('sentNone'), result.sent));
    },
    onError: () => setNotice(resultNotice(t('sendFailed'), false)),
  });
  const sendAll = useMutation({
    mutationFn: (studentIds: string[]) => sendParentQuarter(quarterKey ?? '', studentIds),
    onSuccess: (result) => {
      refresh();
      setConfirmOpen(false);
      setNotice(resultNotice(allMessage(t, result.sent, result.skipped), result.sent > 0));
    },
    onError: () => {
      setConfirmOpen(false);
      setNotice(resultNotice(t('sendFailed'), false));
    },
  });

  return { notice, dismissNotice, confirmOpen, setConfirmOpen, sendOne, sendAll };
}

function resultNotice(message: string, ok: boolean): Notice {
  return { key: Date.now(), message, variant: ok ? 'success' : 'error' };
}

function allMessage(t: (key: string, values?: { sent: number; skipped: number }) => string, sent: number, skipped: number) {
  if (sent === 0) return t('sentNone');
  if (skipped > 0) return t('sentResultSkipped', { sent, skipped });
  return t('sentResult', { sent, skipped });
}
