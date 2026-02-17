'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Badge } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Locale } from '@/config/i18n';
import { useLogo, useUploadLogo, useDeleteLogo } from '@/features/settings/hooks/useSettings';
import { getErrorMessage } from '@/shared/lib/api';

type SettingsTab = 'security' | 'notifications' | 'system';

export default function SettingsPage() {
  const { user: _user, logout } = useAuthStore();
  const router = useRouter();
  const _pathname = usePathname();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');
  const _tCommon = useTranslations('common');
  const _locale = useLocale() as Locale;

  const handleLogout = () => {
    logout();
    // Redirect to root page after logout
    router.replace('/');
  };

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    // TODO: Implement password change API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Password changed successfully!');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'security',
      label: t('security'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'system',
      label: t('systemSettings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Danger Zone */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-800 mb-2">Session</h3>
            <p className="text-sm text-slate-500 mb-4">
              {t('signOutFromAccount')}
            </p>
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              {t('signOut')}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('changePassword')}</h2>
                
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('currentPassword')}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('newPassword')}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t('minimum8Characters')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('confirmNewPassword')}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                      disabled={isSaving}
                    >
                      {isSaving ? t('updating') : t('updatePassword')}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('sessions')}</h2>
                <p className="text-sm text-slate-500 mb-4">
                  {t('manageActiveSessions')}
                </p>
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t('currentSession')}</p>
                      <p className="text-xs text-slate-500">{t('thisDevice')} • {t('activeNow')}</p>
                    </div>
                  </div>
                  <Badge variant="success">{t('active')}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('notificationPreferences')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-medium text-slate-800">{t('emailNotifications')}</h3>
                    <p className="text-sm text-slate-500">{t('receiveImportantUpdates')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-medium text-slate-800">{t('lessonReminders')}</h3>
                    <p className="text-sm text-slate-500">{t('getNotifiedBeforeScheduledLessons')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonReminders}
                      onChange={(e) => setLessonReminders(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium text-slate-800">{t('paymentReminders')}</h3>
                    <p className="text-sm text-slate-500">{t('receiveAlertsAboutPayments')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentReminders}
                      onChange={(e) => setPaymentReminders(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                  {t('savePreferences')}
                </Button>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('appearance')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">{t('theme')}</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'light', label: t('light') },
                        { value: 'dark', label: t('dark') },
                        { value: 'system', label: t('system') }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          className={`px-4 py-2 rounded-lg border ${
                            theme.value === 'light'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">{t('language')}</label>
                    <LanguageSwitcher />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">{t('timezone')}</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="Asia/Yerevan">Asia/Yerevan (UTC+4)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logo Upload Section */}
              <LogoUploadSection />

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('about')}</h2>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="text-slate-500">{t('version')}:</span> 1.0.0</p>
                  <p><span className="text-slate-500">{t('environment')}:</span> Production</p>
                  <p><span className="text-slate-500">{t('build')}:</span> {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * Logo Upload Section Component
 */
function LogoUploadSection() {
  const _t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { data: logoData, isLoading: isLoadingLogo } = useLogo();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();

  const currentLogoUrl = logoData?.logoUrl || null;

  // Set preview when logo data changes
  useEffect(() => {
    if (currentLogoUrl) {
      setPreviewUrl(currentLogoUrl);
    }
  }, [currentLogoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/svg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PNG, JPG, WEBP, and SVG images are allowed.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadError(null);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError('Please select a file first.');
      return;
    }

    setUploadError(null);
    try {
      await uploadLogo.mutateAsync(file);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      setUploadError(getErrorMessage(error, 'Failed to upload logo. Please try again.'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the logo? This will remove it for all users.')) {
      return;
    }

    setUploadError(null);
    try {
      await deleteLogo.mutateAsync();
      setPreviewUrl(null);
    } catch (error: unknown) {
      setUploadError(getErrorMessage(error, 'Failed to delete logo. Please try again.'));
    }
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Logo</h2>
      
      <div className="space-y-6">
        {/* Current Logo Preview */}
        {displayUrl && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Current Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <img
                  src={displayUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                  onError={() => {
                    setPreviewUrl(null);
                  }}
                />
              </div>
              {currentLogoUrl && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleteLogo.isPending}
                >
                  {deleteLogo.isPending ? 'Deleting...' : 'Delete Logo'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {displayUrl ? 'Replace Logo' : 'Upload Logo'}
          </label>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Choose File</span>
              </label>
              {fileInputRef.current?.files?.[0] && (
                <span className="ml-3 text-sm text-slate-600">
                  {fileInputRef.current.files[0].name}
                </span>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {uploadError}
              </div>
            )}

            <div className="text-xs text-slate-500 space-y-1">
              <p>• Allowed formats: PNG, JPG, WEBP, SVG</p>
              <p>• Maximum file size: 5MB</p>
              <p>• The logo will be displayed in the sidebar for all users</p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!fileInputRef.current?.files?.[0] || uploadLogo.isPending || isLoadingLogo}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
