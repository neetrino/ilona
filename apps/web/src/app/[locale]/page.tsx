'use client';

import { useLandingAuthRedirect } from '@/features/landing/hooks/useLandingAuthRedirect';
import { LandingPageContent } from '@/features/landing/components/LandingPageContent';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function HomePage() {
  const { shouldRedirect } = useLandingAuthRedirect();

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <LandingPageContent />;
}
