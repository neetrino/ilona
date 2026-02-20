'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { usePenalties, useUpdatePenalties } from '@/features/settings/hooks/useSettings';
import { getErrorMessage } from '@/shared/lib/api';

export function PenaltyTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: penalties, isLoading } = usePenalties();
  const updatePenalties = useUpdatePenalties();
  
  const [penaltyAbsenceAmd, setPenaltyAbsenceAmd] = useState(1000);
  const [penaltyFeedbackAmd, setPenaltyFeedbackAmd] = useState(1000);
  const [penaltyVoiceAmd, setPenaltyVoiceAmd] = useState(1000);
  const [penaltyTextAmd, setPenaltyTextAmd] = useState(1000);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from API data
  useEffect(() => {
    if (penalties) {
      setPenaltyAbsenceAmd(penalties.penaltyAbsenceAmd);
      setPenaltyFeedbackAmd(penalties.penaltyFeedbackAmd);
      setPenaltyVoiceAmd(penalties.penaltyVoiceAmd);
      setPenaltyTextAmd(penalties.penaltyTextAmd);
    }
  }, [penalties]);

  const isValid = 
    penaltyAbsenceAmd >= 0 &&
    penaltyFeedbackAmd >= 0 &&
    penaltyVoiceAmd >= 0 &&
    penaltyTextAmd >= 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(t('penaltyAmountsMustBeNonNegative'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updatePenalties.mutateAsync({
        penaltyAbsenceAmd,
        penaltyFeedbackAmd,
        penaltyVoiceAmd,
        penaltyTextAmd,
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
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
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
      <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('penaltyAmounts')}</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            {t('penaltyAmountsDescription')}
          </p>

          {/* Absence Penalty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('penaltyAbsenceAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={penaltyAbsenceAmd}
                onChange={(e) => handleInputChange(setPenaltyAbsenceAmd, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">AMD</span>
            </div>
          </div>

          {/* Feedback Penalty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('penaltyFeedbackAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={penaltyFeedbackAmd}
                onChange={(e) => handleInputChange(setPenaltyFeedbackAmd, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">AMD</span>
            </div>
          </div>

          {/* Voice Penalty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('penaltyVoiceAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={penaltyVoiceAmd}
                onChange={(e) => handleInputChange(setPenaltyVoiceAmd, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">AMD</span>
            </div>
          </div>

          {/* Text Penalty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('penaltyTextAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={penaltyTextAmd}
                onChange={(e) => handleInputChange(setPenaltyTextAmd, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">AMD</span>
            </div>
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

