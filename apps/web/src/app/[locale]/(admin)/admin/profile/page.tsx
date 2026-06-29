'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUploadAvatar, useDeleteAvatar, useUpdateProfile } from '@/features/settings/hooks/useSettings';
import {
  portalCardClass,
  portalInnerCardClass,
  portalInputClass,
  portalLabelClass,
  portalPageStackClass,
  portalPrimaryButtonClass,
  portalSecondaryButtonClass,
} from '@/shared/lib/portal-theme';
import Image from 'next/image';

export default function AdminProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('settings');

  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const updateProfileMutation = useUpdateProfile();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Update form state when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError(null);
    setUploadSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setUploadError('Email address is required.');
      setIsSaving(false);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        firstName,
        lastName,
        email: normalizedEmail,
        phone: phone || undefined,
      });
      setUploadSuccess('Profile updated successfully!');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // Validate file size (5MB max - base64 will be ~33% larger)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    try {
      const result = await uploadAvatarMutation.mutateAsync(file);
      setUploadSuccess('Image uploaded successfully!');
      
      // Update user in store if mutation didn't already do it
      if (user && result.avatarUrl) {
        setUser({
          ...user,
          avatarUrl: result.avatarUrl,
        });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await deleteAvatarMutation.mutateAsync();
      setUploadSuccess('Avatar removed successfully!');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to remove avatar');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';
  const avatarUrl = user?.avatarUrl;

  return (
    <DashboardLayout title={t('profile')} subtitle={t('profileInformation')}>
      <div className={portalPageStackClass}>
        <section className={portalCardClass}>
          <div className="flex flex-col gap-2">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[#8b8b90]">
              {t('profile')}
            </p>
            <h2 className="text-[clamp(1.1rem,1.8vw,1.35rem)] font-semibold tracking-tight text-[#1010a3]">
              {t('profileInformation')}
            </h2>
          </div>
        </section>

        <section className={portalCardClass}>
          {uploadSuccess && (
            <div className="mb-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-700">{uploadSuccess}</p>
            </div>
          )}
          {uploadError && (
            <div className="mb-4 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{uploadError}</p>
            </div>
          )}

          <div className="mb-6 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 sm:mb-8 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full border-2 border-[rgba(14,14,16,0.07)] object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full bg-[#1010a3] text-2xl font-bold text-white ${avatarUrl ? 'hidden' : ''}`}
                >
                  {initials}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-[#3b3b40]">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="truncate text-sm text-[#8b8b90]">{user?.email}</p>
                <p className="mt-1 text-xs text-[#8b8b90]">
                  {t('imageFormats') ?? 'JPG, PNG, WEBP up to 5MB'}
                </p>
              </div>

              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className={portalSecondaryButtonClass}
                  onClick={handleUploadClick}
                  disabled={uploadAvatarMutation.isPending}
                >
                  {uploadAvatarMutation.isPending
                    ? (t('uploading') ?? 'Uploading...')
                    : t('uploadPhoto')}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                    onClick={handleRemoveAvatar}
                    disabled={deleteAvatarMutation.isPending}
                  >
                    {deleteAvatarMutation.isPending
                      ? (t('removing') ?? 'Removing...')
                      : t('remove')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={portalInnerCardClass}>
                <label className={portalLabelClass}>{t('firstName')}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={portalInputClass}
                />
              </div>

              <div className={portalInnerCardClass}>
                <label className={portalLabelClass}>{t('lastName')}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={portalInputClass}
                />
              </div>
            </div>

            <div className={portalInnerCardClass}>
              <label className={portalLabelClass}>{t('emailAddress')}</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={portalInputClass}
              />
            </div>

            <div className={portalInnerCardClass}>
              <label className={portalLabelClass}>{t('phoneNumber')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className={portalInputClass}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="ghost" className={portalPrimaryButtonClass} disabled={isSaving}>
                {isSaving ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

