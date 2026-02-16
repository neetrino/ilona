'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUploadAvatar, useDeleteAvatar, useUpdateProfile } from '@/features/settings/hooks/useSettings';

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
    <DashboardLayout 
      title={t('profile')} 
      subtitle={t('profileInformation')}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('profileInformation') ?? 'Profile Information'}</h2>
        
        {/* Success/Error Messages */}
        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-600">{uploadSuccess}</p>
          </div>
        )}
        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold ${avatarUrl ? 'hidden' : ''}`}
            >
              {initials}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
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
                {uploadAvatarMutation.isPending ? (t('uploading') ?? 'Uploading...') : (t('uploadPhoto') ?? 'Upload Photo')}
              </Button>
              {avatarUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600"
                  onClick={handleRemoveAvatar}
                  disabled={deleteAvatarMutation.isPending}
                >
                  {deleteAvatarMutation.isPending ? (t('removing') ?? 'Removing...') : (t('remove') ?? 'Remove')}
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('imageFormats') ?? 'JPG, PNG, WEBP, GIF up to 5MB'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('firstName') ?? 'First Name'}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('lastName') ?? 'Last Name'}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('emailAddress') ?? 'Email Address'}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">{t('contactAdminToChangeEmail') ?? 'Contact admin to change email'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('phoneNumber') ?? 'Phone Number'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              disabled={isSaving}
            >
              {isSaving ? (t('saving') ?? 'Saving...') : (t('saveChanges') ?? 'Save Changes')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

