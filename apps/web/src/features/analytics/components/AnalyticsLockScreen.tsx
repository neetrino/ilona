'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/shared/components/ui';
import { unlockAnalytics } from '../api/analytics.api'; 
import { cn } from '@/shared/lib/utils';

interface AnalyticsLockScreenProps {
  onUnlock: () => void;
}

export function AnalyticsLockScreen({ onUnlock }: AnalyticsLockScreenProps) {
  const router = useRouter();
  const t = useTranslations('analytics');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await unlockAnalytics(password);
      console.log('Unlock successful:', result);
      // Success - cookie is set by backend
      // Small delay to ensure cookie is set before next request
      await new Promise(resolve => setTimeout(resolve, 200));
      onUnlock();
    } catch (err: unknown) {
      console.error('Unlock error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid password';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Analytics Access Required
          </h2>
          <p className="text-sm text-slate-600 text-center mb-6">
            Please enter your login password to access the Analytics page
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
                disabled={isLoading}
                error={error || undefined}
                autoFocus
                autoComplete="new-password"
                className="w-full"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                isLoading={isLoading}
                className="flex-1"
              >
                Unlock
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

