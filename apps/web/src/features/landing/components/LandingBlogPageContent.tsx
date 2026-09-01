'use client';

import dynamic from 'next/dynamic';
import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';
import { LandingCanvasScaleRuntime } from '@/shared/components/layout/LandingCanvasScaleInit';
import { CanvasScaler } from '@/shared/components/layout/CanvasScaler';
import { useLandingTr } from '../hooks/useLandingTr';
import { LandingBlogGrid } from './LandingBlogGrid';
import { LandingSectionPlaceholder } from './LandingSectionPlaceholder';

const LandingFooter = dynamic(
  () =>
    import('./LandingFooter').then((module) => ({
      default: module.LandingFooter,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[280px] bg-black" /> },
);

export function LandingBlogPageContent() {
  const { tr, isHy } = useLandingTr();
  const { isAuthenticated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const profileHref = isAuthenticated && user ? getPortalEntryPath(user.role) : '/login';

  return (
    <>
      <LandingCanvasScaleRuntime />
      <LandingNavbar logoUrl={logoUrl} profileHref={profileHref} logoHref="/" activeSection="blog" />
      <CanvasScaler className="min-h-screen">
        <section className="bg-[#f9fafb] pt-28">
          <LandingBlogGrid tr={tr} isHy={isHy} sectionTitleTone="brand" />
        </section>
        <LandingFooter tr={tr} isHy={isHy} logoUrl={logoUrl} />
      </CanvasScaler>
    </>
  );
}
