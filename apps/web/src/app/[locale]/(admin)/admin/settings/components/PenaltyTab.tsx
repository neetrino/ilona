'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { usePenalties, useUpdatePenalties } from '@/features/settings/hooks/useSettings';
import { getErrorMessage } from '@/shared/lib/api';

type PenaltyFormValues = {
  penaltyAbsenceAmd: string;
  penaltyFeedbackAmd: string;
  penaltyVoiceAmd: string;
  penaltyTextAmd: string;
  penaltyDailyPlanAmd: string;
};

function parseNonNegativeNumber(value: string): number | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);
  if (Number.isNaN(parsedValue) || parsedValue < 0) return null;

  return parsedValue;
}

export function PenaltyTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: penalties, isLoading } = usePenalties();
  const updatePenalties = useUpdatePenalties();
  
  const [formValues, setFormValues] = useState<PenaltyFormValues>({
    penaltyAbsenceAmd: '1000',
    penaltyFeedbackAmd: '500',
    penaltyVoiceAmd: '1000',
    penaltyTextAmd: '1000',
    penaltyDailyPlanAmd: '1000',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from API data
  useEffect(() => {
    if (penalties) {
      setFormValues({
        penaltyAbsenceAmd: String(penalties.penaltyAbsenceAmd),
        penaltyFeedbackAmd: String(penalties.penaltyFeedbackAmd),
        penaltyVoiceAmd: String(penalties.penaltyVoiceAmd),
        penaltyTextAmd: String(penalties.penaltyTextAmd),
        penaltyDailyPlanAmd: String(penalties.penaltyDailyPlanAmd ?? 1000),
      });
    }
  }, [penalties]);

  const parsedPenalties = {
    penaltyAbsenceAmd: parseNonNegativeNumber(formValues.penaltyAbsenceAmd),
    penaltyFeedbackAmd: parseNonNegativeNumber(formValues.penaltyFeedbackAmd),
    penaltyVoiceAmd: parseNonNegativeNumber(formValues.penaltyVoiceAmd),
    penaltyTextAmd: parseNonNegativeNumber(formValues.penaltyTextAmd),
    penaltyDailyPlanAmd: parseNonNegativeNumber(formValues.penaltyDailyPlanAmd),
  };

  const isValid = Object.values(parsedPenalties).every((value) => value !== null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      penaltyAbsenceAmd,
      penaltyFeedbackAmd,
      penaltyVoiceAmd,
      penaltyTextAmd,
      penaltyDailyPlanAmd,
    } = parsedPenalties;

    if (
      penaltyAbsenceAmd === null ||
      penaltyFeedbackAmd === null ||
      penaltyVoiceAmd === null ||
      penaltyTextAmd === null ||
      penaltyDailyPlanAmd === null
    ) {
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
        penaltyDailyPlanAmd,
      });
      // Success toast will be handled by the mutation
    } catch (err) {
      setError(getErrorMessage(err, t('failedToSaveSettings')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PenaltyFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
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
                value={formValues.penaltyAbsenceAmd}
                onChange={(e) => handleInputChange('penaltyAbsenceAmd', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">֏</span>
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
                value={formValues.penaltyFeedbackAmd}
                onChange={(e) => handleInputChange('penaltyFeedbackAmd', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">֏</span>
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
                value={formValues.penaltyVoiceAmd}
                onChange={(e) => handleInputChange('penaltyVoiceAmd', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">֏</span>
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
                value={formValues.penaltyTextAmd}
                onChange={(e) => handleInputChange('penaltyTextAmd', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">֏</span>
            </div>
          </div>

          {/* Daily Plan Penalty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('penaltyDailyPlanAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyDailyPlanAmd}
                onChange={(e) => handleInputChange('penaltyDailyPlanAmd', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">֏</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{t('penaltyDailyPlanAmdHint')}</p>
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



