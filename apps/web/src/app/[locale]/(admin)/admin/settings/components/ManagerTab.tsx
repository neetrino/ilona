'use client';

import { useTranslations } from 'next-intl';

export function ManagerTab() {
  const t = useTranslations('settings');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800">{t('manager')}</h2>
    </div>
  );
}
