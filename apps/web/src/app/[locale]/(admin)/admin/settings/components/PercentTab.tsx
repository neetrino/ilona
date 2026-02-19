'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { useActionPercents, useUpdateActionPercents } from '@/features/settings/hooks/useSettings';
import { getErrorMessage } from '@/shared/lib/api';

export function PercentTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: actionPercents, isLoading } = useActionPercents();
  const updateActionPercents = useUpdateActionPercents();
  
  const [absencePercent, setAbsencePercent] = useState(25);
  const [feedbacksPercent, setFeedbacksPercent] = useState(25);
  const [voicePercent, setVoicePercent] = useState(25);
  const [textPercent, setTextPercent] = useState(25);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from API data
  useEffect(() => {
    if (actionPercents) {
      setAbsencePercent(actionPercents.absencePercent);
      setFeedbacksPercent(actionPercents.feedbacksPercent);
      setVoicePercent(actionPercents.voicePercent);
      setTextPercent(actionPercents.textPercent);
    }
  }, [actionPercents]);

  const total = absencePercent + feedbacksPercent + voicePercent + textPercent;
  const isValid = total === 100 && 
                  absencePercent >= 0 && absencePercent <= 100 &&
                  feedbacksPercent >= 0 && feedbacksPercent <= 100 &&
                  voicePercent >= 0 && voicePercent <= 100 &&
                  textPercent >= 0 && textPercent <= 100 &&
                  Number.isInteger(absencePercent) &&
                  Number.isInteger(feedbacksPercent) &&
                  Number.isInteger(voicePercent) &&
                  Number.isInteger(textPercent);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(t('totalMustEqual100'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateActionPercents.mutateAsync({
        absencePercent,
        feedbacksPercent,
        voicePercent,
        textPercent,
      });
      // Success toast will be handled by the mutation
    } catch (err) {
      setError(getErrorMessage(err, t('failedToSaveSettings')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    setter: (value: number) => void,
    value: string
  ) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setter(numValue);
    } else if (value === '') {
      setter(0);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-slate-500">{tCommon('loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('actionPercentWeights')}</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            {t('actionPercentDescription')}
          </p>

          {/* Absence Percent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('absencePercent')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={absencePercent}
              onChange={(e) => handleInputChange(setAbsencePercent, e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Feedbacks Percent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('feedbacksPercent')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={feedbacksPercent}
              onChange={(e) => handleInputChange(setFeedbacksPercent, e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Voice Percent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('voicePercent')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={voicePercent}
              onChange={(e) => handleInputChange(setVoicePercent, e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Text Percent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('textPercent')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={textPercent}
              onChange={(e) => handleInputChange(setTextPercent, e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Total Display */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{t('total')}:</span>
              <span className={`text-lg font-semibold ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {total}%
              </span>
            </div>
            {total !== 100 && (
              <p className="text-xs text-red-600 mt-1">{t('totalMustEqual100')}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            disabled={!isValid || isSaving}
          >
            {isSaving ? t('saving') : tCommon('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

