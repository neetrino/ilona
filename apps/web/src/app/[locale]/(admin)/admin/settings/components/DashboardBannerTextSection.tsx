'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import {
  useDashboardBanner,
  useUpdateDashboardBannerText,
} from '@/features/settings';

const TITLE_MAX_LENGTH = 150;
const SUBTITLE_MAX_LENGTH = 400;

const inputClassName =
  'w-full rounded-xl border border-[rgba(14,14,16,0.07)] px-4 py-3 text-sm text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20';

export function DashboardBannerTextSection() {
  const t = useTranslations('settings');
  const tDashboard = useTranslations('dashboard');
  const { data: bannerData, isLoading } = useDashboardBanner();
  const updateMutation = useUpdateDashboardBannerText();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultTitle = tDashboard('banner.adminTitle');
  const defaultSubtitle = tDashboard('banner.adminSubtitle');

  useEffect(() => {
    setTitle(bannerData?.title ?? '');
    setSubtitle(bannerData?.subtitle ?? '');
  }, [bannerData?.title, bannerData?.subtitle]);

  const hasCustomText = Boolean(bannerData?.title || bannerData?.subtitle);
  const isDirty = useMemo(() => {
    const savedTitle = bannerData?.title ?? '';
    const savedSubtitle = bannerData?.subtitle ?? '';
    return title !== savedTitle || subtitle !== savedSubtitle;
  }, [bannerData?.subtitle, bannerData?.title, subtitle, title]);

  const previewTitle = title.trim() || defaultTitle;
  const previewSubtitle = subtitle.trim() || defaultSubtitle;

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateMutation.mutateAsync({
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
      });
      setSuccessMessage(t('dashboardBannerTextSavedSuccess'));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('dashboardBannerTextSaveFailed'),
      );
    }
  };

  const handleReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateMutation.mutateAsync({
        title: null,
        subtitle: null,
      });
      setTitle('');
      setSubtitle('');
      setSuccessMessage(t('dashboardBannerTextResetSuccess'));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('dashboardBannerTextResetFailed'),
      );
    }
  };

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-lg font-semibold text-[#3b3b40]">{t('dashboardBannerTextTitle')}</h2>
        <p className="text-sm text-[#8b8b90]">{t('dashboardBannerTextDescription')}</p>
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
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
            {t('dashboardBannerTextHeadingLabel')}
          </label>
          <input
            type="text"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            placeholder={defaultTitle}
            disabled={isLoading || updateMutation.isPending}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-[#8b8b90]">
            {t('dashboardBannerTextHeadingHint', { max: TITLE_MAX_LENGTH })}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
            {t('dashboardBannerTextSubtitleLabel')}
          </label>
          <textarea
            value={subtitle}
            maxLength={SUBTITLE_MAX_LENGTH}
            rows={3}
            placeholder={defaultSubtitle}
            disabled={isLoading || updateMutation.isPending}
            onChange={(event) => setSubtitle(event.target.value)}
            className={`${inputClassName} resize-y`}
          />
          <p className="mt-1 text-xs text-[#8b8b90]">
            {t('dashboardBannerTextSubtitleHint', { max: SUBTITLE_MAX_LENGTH })}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 sm:p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b90]">
          {t('dashboardBannerTextPreviewLabel')}
        </p>
        <div className="rounded-2xl bg-[#1010a3] p-5 sm:p-6">
          <h3 className="text-xl font-bold leading-tight text-[#f7f7f5] sm:text-2xl">
            {previewTitle}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b9b9bd]">
            {previewSubtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {hasCustomText ? (
          <Button
            type="button"
            variant="ghost"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            onClick={handleReset}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('saving') : t('dashboardBannerTextResetDefault')}
          </Button>
        ) : null}

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
