'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export function SystemTab() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#3b3b40] mb-6">{t('appearance')}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-3">{t('theme')}</label>
            <div className="flex gap-3">
              {[
                { value: 'light', label: t('light') },
                { value: 'dark', label: t('dark') },
                { value: 'system', label: t('system') }
              ].map((theme) => (
                <button
                  key={theme.value}
                  className={`px-4 py-2 rounded-lg border ${
                    theme.value === 'light'
                      ? 'border-[#1010a3] bg-[#f0f0fc] text-[#1010a3]'
                      : 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#fafafa]'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-3">{t('language')}</label>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#3b3b40] mb-4">{t('about')}</h2>
        <div className="space-y-2 text-sm text-[#3b3b40]">
          <p><span className="text-[#8b8b90]">{t('version')}:</span> 1.0.0</p>
          <p><span className="text-[#8b8b90]">{t('environment')}:</span> Production</p>
          <p><span className="text-[#8b8b90]">{t('build')}:</span> {new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>
    </div>
  );
}

