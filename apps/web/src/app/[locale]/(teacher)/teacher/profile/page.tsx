'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import {
  StudentAlert,
  StudentBadge,
  StudentCard,
  StudentFieldLabel,
  StudentGhostButton,
  StudentInput,
  StudentPageStack,
  StudentPrimaryButton,
  StudentSectionHeader,
} from '@/features/student-ui';
import { cn } from '@/shared/lib/utils';
import { studentInputClass } from '@/features/student-ui/tokens';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUploadAvatar, useDeleteAvatar, useUpdateProfile } from '@/features/settings/hooks/useSettings';
import Image from 'next/image';
import { getExperienceYearsFromHireDate, formatExperienceLabel } from '@/features/teachers/utils/experience';

export default function TeacherProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('settings');
  const tRoles = useTranslations('roles');

  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const updateProfileMutation = useUpdateProfile();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.teacher?.bio || '');
  const [videoUrl, setVideoUrl] = useState(user?.teacher?.videoUrl || '');
  const [experienceYears, setExperienceYears] = useState(
    getExperienceYearsFromHireDate(user?.teacher?.hireDate)
  );

  // Update form state when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setVideoUrl(user.teacher?.videoUrl || '');
      setBio(user.teacher?.bio || '');
      setExperienceYears(getExperienceYearsFromHireDate(user.teacher?.hireDate));
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const trimmedVideoUrl = videoUrl.trim();
      await updateProfileMutation.mutateAsync({
        firstName,
        lastName,
        phone: phone || undefined,
        videoUrl: trimmedVideoUrl ? trimmedVideoUrl : null,
        bio: bio.trim() ? bio.trim() : null,
        experienceYears,
      });
      setUploadSuccess(t('profileUpdatedSuccess') ?? 'Profile updated successfully!');
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.');
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
      <StudentPageStack>
        <StudentCard>
          <StudentSectionHeader title={t('profileInformation')} />

          {uploadSuccess ? (
            <StudentAlert variant="success" className="mb-4">
              {uploadSuccess}
            </StudentAlert>
          ) : null}
          {uploadError ? (
            <StudentAlert variant="danger" className="mb-4">
              {uploadError}
            </StudentAlert>
          ) : null}

          <div className="mb-8 flex flex-col items-start gap-4 border-b border-[rgba(14,14,16,0.07)] pb-8 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${user?.firstName} ${user?.lastName}`}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-[rgba(14,14,16,0.07)]"
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
          <div>
            <h3 className="font-medium text-[#1010a3]">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-[#8b8b90]">{user?.email}</p>
            <StudentBadge variant="info" className="mt-2">
              {tRoles('teacher')}
            </StudentBadge>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUploadClick}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (t('uploading') ?? 'Uploading...') : t('uploadPhoto')}
              </Button>
              {avatarUrl ? (
                <StudentGhostButton
                  type="button"
                  className="min-h-9 text-[#b42318]"
                  onClick={handleRemoveAvatar}
                  disabled={deleteAvatarMutation.isPending}
                >
                  {deleteAvatarMutation.isPending ? (t('removing') ?? 'Removing...') : t('remove')}
                </StudentGhostButton>
              ) : null}
            </div>
            <p className="text-xs text-[#8b8b90] mt-1">
              {t('imageFormats') ?? 'JPG, PNG, WEBP, GIF up to 5MB'}
            </p>
          </div>
        </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <StudentFieldLabel>{t('firstName')}</StudentFieldLabel>
                <StudentInput
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <StudentFieldLabel>{t('lastName')}</StudentFieldLabel>
                <StudentInput
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <StudentFieldLabel>{t('emailAddress')}</StudentFieldLabel>
              <StudentInput
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-[#f6f6f7] text-[#8b8b90]"
              />
            </div>

            <div>
              <StudentFieldLabel>{t('phoneNumber')}</StudentFieldLabel>
              <StudentInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380 XX XXX XXXX"
              />
            </div>

            <div>
              <StudentFieldLabel>{t('introVideoUrl')}</StudentFieldLabel>
              <StudentInput
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={t('introVideoUrlPlaceholder')}
              />
              <p className="mt-1 text-xs text-[#8b8b90]">{t('introVideoUrlHint')}</p>
            </div>

            <div>
              <StudentFieldLabel>{t('experience')}</StudentFieldLabel>
              <StudentInput
                type="number"
                min={0}
                max={80}
                step={1}
                value={experienceYears}
                onChange={(e) =>
                  setExperienceYears(Math.max(0, Math.trunc(Number(e.target.value || 0))))
                }
                placeholder="5"
              />
              <p className="mt-1 text-xs text-[#8b8b90]">
                {formatExperienceLabel(experienceYears)}
              </p>
            </div>

            <div>
              <StudentFieldLabel>{t('bio')}</StudentFieldLabel>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('bioPlaceholder')}
                rows={3}
                className={cn(studentInputClass, 'min-h-[6rem] resize-none py-3')}
              />
            </div>

            <div className="flex justify-stretch pt-4 sm:justify-end">
              <StudentPrimaryButton type="submit" disabled={isSaving}>
                {isSaving ? t('saving') : t('saveChanges')}
              </StudentPrimaryButton>
            </div>
          </form>
        </StudentCard>
      </StudentPageStack>
    </DashboardLayout>
  );
}

