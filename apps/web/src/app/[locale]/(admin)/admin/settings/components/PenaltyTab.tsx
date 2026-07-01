'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useMessages } from 'next-intl';
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

const EMPTY_PENALTY_FORM: PenaltyFormValues = {
  penaltyAbsenceAmd: '',
  penaltyFeedbackAmd: '',
  penaltyVoiceAmd: '',
  penaltyTextAmd: '',
  penaltyDailyPlanAmd: '',
};

function formatPenaltyField(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

function parseNonNegativeNumber(value: string): number | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);
  if (Number.isNaN(parsedValue) || parsedValue < 0) return null;

  return parsedValue;
}

function getPenaltySavedSuccessMessage(
  settingsMessages: unknown,
  fallbackMessage: string,
): string {
  if (typeof settingsMessages !== 'object' || settingsMessages === null) {
    return fallbackMessage;
  }

  const value = (settingsMessages as Record<string, unknown>).penaltyAmountsSavedSuccess;
  return typeof value === 'string' && value.trim().length > 0 ? value : fallbackMessage;
}

export function PenaltyTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const messages = useMessages();
  const { data: penalties, isLoading } = usePenalties();
  const updatePenalties = useUpdatePenalties();
  
  const [formValues, setFormValues] = useState<PenaltyFormValues>(EMPTY_PENALTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize from API data
  useEffect(() => {
    if (penalties) {
      setFormValues({
        penaltyAbsenceAmd: formatPenaltyField(penalties.penaltyAbsenceAmd),
        penaltyFeedbackAmd: formatPenaltyField(penalties.penaltyFeedbackAmd),
        penaltyVoiceAmd: formatPenaltyField(penalties.penaltyVoiceAmd),
        penaltyTextAmd: formatPenaltyField(penalties.penaltyTextAmd),
        penaltyDailyPlanAmd: formatPenaltyField(penalties.penaltyDailyPlanAmd),
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
    setSuccessMessage(null);

    try {
      const savedPenalties = await updatePenalties.mutateAsync({
        penaltyAbsenceAmd,
        penaltyFeedbackAmd,
        penaltyVoiceAmd,
        penaltyTextAmd,
        penaltyDailyPlanAmd,
      });
      setFormValues({
        penaltyAbsenceAmd: formatPenaltyField(savedPenalties.penaltyAbsenceAmd),
        penaltyFeedbackAmd: formatPenaltyField(savedPenalties.penaltyFeedbackAmd),
        penaltyVoiceAmd: formatPenaltyField(savedPenalties.penaltyVoiceAmd),
        penaltyTextAmd: formatPenaltyField(savedPenalties.penaltyTextAmd),
        penaltyDailyPlanAmd: formatPenaltyField(savedPenalties.penaltyDailyPlanAmd),
      });
      setSuccessMessage(
        getPenaltySavedSuccessMessage(messages.settings, tCommon('savedSuccessfully')),
      );
    } catch (err) {
      setError(getErrorMessage(err, t('failedToSaveSettings')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PenaltyFormValues, value: string) => {
    setSuccessMessage(null);
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <p className="text-[#8b8b90]">{tCommon('loading')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <h2 className="text-lg font-semibold text-[#3b3b40] mb-6">{t('penaltyAmounts')}</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-[#3b3b40] mb-4">
            {t('penaltyAmountsDescription')}
          </p>

          {/* Absence Penalty */}
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-2">
              {t('penaltyAbsenceAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyAbsenceAmd}
                onChange={(e) => handleInputChange('penaltyAbsenceAmd', e.target.value)}
                className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8b90]">֏</span>
            </div>
          </div>

          {/* Feedback Penalty */}
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-2">
              {t('penaltyFeedbackAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyFeedbackAmd}
                onChange={(e) => handleInputChange('penaltyFeedbackAmd', e.target.value)}
                className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8b90]">֏</span>
            </div>
          </div>

          {/* Voice Penalty */}
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-2">
              {t('penaltyVoiceAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyVoiceAmd}
                onChange={(e) => handleInputChange('penaltyVoiceAmd', e.target.value)}
                className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8b90]">֏</span>
            </div>
          </div>

          {/* Text Penalty */}
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-2">
              {t('penaltyTextAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyTextAmd}
                onChange={(e) => handleInputChange('penaltyTextAmd', e.target.value)}
                className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8b90]">֏</span>
            </div>
          </div>

          {/* Daily Plan Penalty */}
          <div>
            <label className="block text-sm font-medium text-[#3b3b40] mb-2">
              {t('penaltyDailyPlanAmd')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.penaltyDailyPlanAmd}
                onChange={(e) => handleInputChange('penaltyDailyPlanAmd', e.target.value)}
                className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8b90]">֏</span>
            </div>
            <p className="mt-1 text-xs text-[#8b8b90]">{t('penaltyDailyPlanAmdHint')}</p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            type="submit"
            size="lg"
            className="h-11 min-h-11 rounded-[15px] bg-[#1010a3] px-6 py-0 text-white hover:bg-[#1010a3]/90"
            disabled={!isValid || isSaving}
          >
            {isSaving ? t('saving') : tCommon('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}



