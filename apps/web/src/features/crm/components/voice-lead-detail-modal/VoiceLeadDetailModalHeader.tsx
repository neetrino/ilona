'use client';

import { useTranslations } from 'next-intl';
import { ADMIN_ICON_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import type { useVoiceLeadDetailModal } from './useVoiceLeadDetailModal';

type VoiceLeadDetailModalHeaderProps = Pick<
  ReturnType<typeof useVoiceLeadDetailModal>,
  'lead' | 'deleting' | 'handleDeleteClick' | 'onClose'
>;

export function VoiceLeadDetailModalHeader({
  lead,
  deleting,
  handleDeleteClick,
  onClose,
}: VoiceLeadDetailModalHeaderProps) {
  const t = useTranslations('crm');

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
      <h2 className="text-lg font-semibold text-slate-900">{t('voiceLead')}</h2>
      <div className="flex items-center gap-2">
        {lead ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {t('deleteLead')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className={`${ADMIN_ICON_BUTTON_CLASS} text-slate-500 hover:bg-slate-100 hover:text-slate-700`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
