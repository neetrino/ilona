'use client';

import { useTranslations } from 'next-intl';
import { ADMIN_ICON_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';

interface LeadDrawerHeaderProps {
  onClose: () => void;
}

export function LeadDrawerHeader({ onClose }: LeadDrawerHeaderProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <h2 className="text-lg font-semibold text-slate-900">{t('leadDetails')}</h2>
      <button
        type="button"
        onClick={onClose}
        className={`${ADMIN_ICON_BUTTON_CLASS} text-slate-500 hover:bg-slate-100 hover:text-slate-700`}
        aria-label={tc('close')}
        title={tc('close')}
      >
        ✕
      </button>
    </div>
  );
}
