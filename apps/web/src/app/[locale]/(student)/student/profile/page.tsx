'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Profile updated successfully!');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';

  return (
    <DashboardLayout 
      title={t('profile')} 
      subtitle={t('profileInformation')}
    >
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Profile Information</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h3 className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">Upload Photo</Button>
              <Button variant="ghost" size="sm" className="text-red-600">Remove</Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">Contact admin to change email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380 XX XXX XXXX"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

