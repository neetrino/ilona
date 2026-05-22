'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import {
  useDashboardBanner,
  useDeleteDashboardBanner,
  useUploadDashboardBanner,
} from '@/features/settings';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

const MAX_BANNER_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/svg',
] as const;
const SAFE_IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

const isSafeImageSrc = (source: string | null | undefined): source is string => {
  if (!source) return false;

  const normalizedSource = source.trim();
  if (!normalizedSource) return false;

  if (normalizedSource.startsWith('blob:')) return true;
  if (normalizedSource.startsWith('/')) {
    return !normalizedSource.startsWith('//');
  }

  try {
    const parsedUrl = new URL(normalizedSource);
    return SAFE_IMAGE_PROTOCOLS.has(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export function DashboardBannerImageSection() {
  const t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: bannerData, isLoading } = useDashboardBanner();
  const uploadMutation = useUploadDashboardBanner();
  const deleteMutation = useDeleteDashboardBanner();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeBannerUrl = useMemo(
    () => getFullApiUrl(bannerData?.bannerUrl) ?? null,
    [bannerData?.bannerUrl],
  );

  const displayImageSrc = useMemo(() => {
    if (isSafeImageSrc(activeBannerUrl)) return activeBannerUrl;
    return STUDENT_DASHBOARD_ASSETS.heroIllustration;
  }, [activeBannerUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      setErrorMessage(t('dashboardBannerInvalidType'));
      return;
    }

    if (file.size > MAX_BANNER_SIZE) {
      setErrorMessage(t('dashboardBannerFileTooLarge'));
      return;
    }

    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setSuccessMessage(t('dashboardBannerSavedSuccess'));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('dashboardBannerSaveFailed'),
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteMutation.mutateAsync();
      setSelectedFile(null);
      setSuccessMessage(t('dashboardBannerResetSuccess'));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('dashboardBannerResetFailed'),
      );
    }
  };

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-lg font-semibold text-[#3b3b40]">{t('dashboardBannerTitle')}</h2>
        <p className="text-sm text-[#8b8b90]">{t('dashboardBannerDescription')}</p>
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

      <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 sm:p-5">
        <div className="relative overflow-hidden rounded-2xl bg-[#1010a3] p-4 sm:p-5">
          <div className="relative h-48 w-full sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImageSrc}
              alt={t('dashboardBannerPreviewAlt')}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-[#8b8b90]">
          {isLoading ? t('loading') : t('dashboardBannerFormatsHint')}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/svg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-4 text-sm font-medium text-[#3b3b40] transition-colors hover:bg-[#f5f5f6]"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending || deleteMutation.isPending}
        >
          {selectedFile ? t('dashboardBannerChangeImage') : t('dashboardBannerUploadImage')}
        </Button>

        {activeBannerUrl ? (
          <Button
            type="button"
            variant="ghost"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            onClick={handleReset}
            disabled={uploadMutation.isPending || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('removing') : t('dashboardBannerResetDefault')}
          </Button>
        ) : null}

        <Button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#1010a3] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSave}
          disabled={!selectedFile || uploadMutation.isPending || deleteMutation.isPending}
        >
          {uploadMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
