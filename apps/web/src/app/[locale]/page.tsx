'use client';

import { useLandingAuthRedirect } from '@/features/landing/hooks/useLandingAuthRedirect';
import { useScrollPositionRestore } from '@/features/landing/hooks/useScrollPositionRestore';
import { LandingPageContent } from '@/features/landing/components/LandingPageContent';

export default function HomePage() {
  const { isLoading } = useLandingAuthRedirect();
  useScrollPositionRestore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return <LandingPageContent />;
}
