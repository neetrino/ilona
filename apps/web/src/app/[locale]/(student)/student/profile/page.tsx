'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import {
  StudentAlert,
  StudentCard,
  StudentFieldLabel,
  StudentGhostButton,
  StudentInput,
  StudentPageStack,
  StudentPrimaryButton,
  StudentSectionHeader,
} from '@/features/student-ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUploadAvatar, useDeleteAvatar, useUpdateProfile } from '@/features/settings/hooks/useSettings';
import Image from 'next/image';

export default function StudentProfilePage() {
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
  const [phone, setPhone] = useState(user?.phone || '');

  // Update form state when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await updateProfileMutation.mutateAsync({
        firstName,
        lastName,
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
    <DashboardLayout 
      title={t('profile')} 
      subtitle={t('profileInformation')}
    >
      <StudentPageStack>
      <StudentCard>
        <StudentSectionHeader title={t('profileInformation') ?? 'Profile Information'} />

        {uploadSuccess && (
          <StudentAlert variant="success" className="mb-4">{uploadSuccess}</StudentAlert>
        )}
        {uploadError && (
          <StudentAlert variant="danger" className="mb-4">{uploadError}</StudentAlert>
        )}

        <div className="mb-8 flex flex-col items-start gap-4 border-b border-[rgba(14,14,16,0.07)] pb-8 sm:flex-row sm:items-center sm:gap-6">
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
          <div>
            <h3 className="font-medium text-[#1010a3]">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-[#8b8b90]">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUploadClick}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (t('uploading') ?? 'Uploading...') : (t('uploadPhoto') ?? 'Upload Photo')}
              </Button>
              {avatarUrl && (
                <StudentGhostButton
                  type="button"
                  className="min-h-9 text-[#b42318]"
                  onClick={handleRemoveAvatar}
                  disabled={deleteAvatarMutation.isPending}
                >
                  {deleteAvatarMutation.isPending ? (t('removing') ?? 'Removing...') : (t('remove') ?? 'Remove')}
                </StudentGhostButton>
              )}
            </div>
            <p className="mt-1 text-xs text-[#8b8b90]">
              {t('imageFormats') ?? 'JPG, PNG, WEBP up to 5MB'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <StudentFieldLabel>{t('firstName') ?? 'First Name'}</StudentFieldLabel>
              <StudentInput
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <StudentFieldLabel>{t('lastName') ?? 'Last Name'}</StudentFieldLabel>
              <StudentInput
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <StudentFieldLabel>{t('emailAddress') ?? 'Email Address'}</StudentFieldLabel>
            <StudentInput type="email" value={user?.email || ''} disabled className="bg-[#f6f6f7] text-[#8b8b90]" />
            <p className="mt-1 text-xs text-[#8b8b90]">
              {t('contactAdminToChangeEmail') ?? 'Contact admin to change email'}
            </p>
          </div>

          <div>
            <StudentFieldLabel>{t('phoneNumber') ?? 'Phone Number'}</StudentFieldLabel>
            <StudentInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <div className="flex justify-stretch pt-4 sm:justify-end">
            <StudentPrimaryButton type="submit" disabled={isSaving}>
              {isSaving ? (t('saving') ?? 'Saving...') : (t('saveChanges') ?? 'Save Changes')}
            </StudentPrimaryButton>
          </div>
        </form>
      </StudentCard>
      </StudentPageStack>
    </DashboardLayout>
  );
}

