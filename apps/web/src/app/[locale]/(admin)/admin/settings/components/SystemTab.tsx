'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { LogoUploadSection } from './LogoUploadSection';

export function SystemTab() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('appearance')}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('theme')}</label>
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
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('language')}</label>
            <LanguageSwitcher />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('timezone')}</label>
            <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="Asia/Yerevan">Asia/Yerevan (UTC+4)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logo Upload Section */}
      <LogoUploadSection />

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('about')}</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p><span className="text-slate-500">{t('version')}:</span> 1.0.0</p>
          <p><span className="text-slate-500">{t('environment')}:</span> Production</p>
          <p><span className="text-slate-500">{t('build')}:</span> {new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>
    </div>
  );
}

