'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { isValidFooterIconLink, type FooterIconKey } from '@ilona/types';
import { useFooterIconLinks, useUpdateFooterIconLinks } from '@/features/settings/hooks/useFooterIconLinks';

const FOOTER_ICON_FIELDS: FooterIconKey[] = [
  'instagram',
  'facebook',
  'telegram',
  'whatsapp',
  'viber',
];

const inputClassName =
  'w-full rounded-xl border border-[rgba(14,14,16,0.07)] px-4 py-3 text-sm text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20';

type FormState = Record<FooterIconKey, string>;

function toFormState(links: Partial<Record<FooterIconKey, string | null>> | undefined): FormState {
  return {
    instagram: links?.instagram ?? '',
    facebook: links?.facebook ?? '',
    telegram: links?.telegram ?? '',
    whatsapp: links?.whatsapp ?? '',
    viber: links?.viber ?? '',
  };
}

const FOOTER_ICON_LABEL_KEYS: Record<FooterIconKey, 'footerIconLinksInstagram' | 'footerIconLinksFacebook' | 'footerIconLinksTelegram' | 'footerIconLinksWhatsapp' | 'footerIconLinksViber'> = {
  instagram: 'footerIconLinksInstagram',
  facebook: 'footerIconLinksFacebook',
  telegram: 'footerIconLinksTelegram',
  whatsapp: 'footerIconLinksWhatsapp',
  viber: 'footerIconLinksViber',
};

export function FooterIconLinksTab() {
  const t = useTranslations('settings');
  const { data: savedLinks, isLoading } = useFooterIconLinks();
  const updateMutation = useUpdateFooterIconLinks();

  const [form, setForm] = useState<FormState>(toFormState(undefined));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FooterIconKey, string>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(toFormState(savedLinks));
  }, [savedLinks]);

  const isDirty = useMemo(() => {
    const saved = toFormState(savedLinks);
    return FOOTER_ICON_FIELDS.some((key) => form[key] !== saved[key]);
  }, [form, savedLinks]);

  const handleFieldChange = (key: FooterIconKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<FooterIconKey, string>> = {};

    for (const key of FOOTER_ICON_FIELDS) {
      const value = form[key];
      if (value.trim() && !isValidFooterIconLink(value)) {
        errors[key] = t('footerIconLinksInvalidUrl');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    const payload = Object.fromEntries(
      FOOTER_ICON_FIELDS.map((key) => [key, form[key].trim() || null]),
    ) as Partial<Record<FooterIconKey, string | null>>;

    try {
      await updateMutation.mutateAsync(payload);
      setSuccessMessage(t('footerIconLinksSavedSuccess'));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('footerIconLinksSaveFailed'),
      );
    }
  };

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-lg font-semibold text-[#3b3b40]">{t('footerIconLinksTitle')}</h2>
        <p className="text-sm text-[#8b8b90]">{t('footerIconLinksDescription')}</p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        {FOOTER_ICON_FIELDS.map((key) => (
          <div key={key}>
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
              {t(FOOTER_ICON_LABEL_KEYS[key])}
            </label>
            <input
              type="url"
              value={form[key]}
              placeholder={t('footerIconLinksPlaceholder')}
              disabled={isLoading || updateMutation.isPending}
              onChange={(event) => handleFieldChange(key, event.target.value)}
              className={inputClassName}
            />
            {fieldErrors[key] ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>
            ) : (
              <p className="mt-1 text-xs text-[#8b8b90]">{t('footerIconLinksHint')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#1010a3] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
