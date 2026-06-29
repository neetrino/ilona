'use client';

import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';
import { CanvasScaler } from '@/shared/components/layout/CanvasScaler';
import { useLandingTr } from '../hooks/useLandingTr';
import { LandingHeroSection } from './LandingHeroSection';
import { LandingAboutSection } from './LandingAboutSection';
import { LandingWhyChooseSection } from './LandingWhyChooseSection';
import { LandingStudentSuccessSection } from './LandingStudentSuccessSection';
import { LandingProgramsSection } from './LandingProgramsSection';
import { LandingBranchesSection } from './LandingBranchesSection';
import { LandingFollowUsSection } from './LandingFollowUsSection';
import { LandingGetInTouchSection } from './LandingGetInTouchSection';
import { LandingJoinTeamSection } from './LandingJoinTeamSection';
import { LandingNewsSection } from './LandingNewsSection';
import { LandingFaqSection } from './LandingFaqSection';
import { LandingFooter } from './LandingFooter';

export function LandingPageContent() {
  const { tr, isHy } = useLandingTr();
  const { isAuthenticated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const profileHref = isAuthenticated && user ? getPortalEntryPath(user.role) : '/login';

  return (
    <>
      <LandingNavbar logoUrl={logoUrl} profileHref={profileHref} />
      <CanvasScaler className="min-h-screen">
        <LandingHeroSection tr={tr} isHy={isHy} />
        <LandingAboutSection tr={tr} isHy={isHy} />
        <LandingWhyChooseSection tr={tr} isHy={isHy} />
        <LandingStudentSuccessSection tr={tr} isHy={isHy} />
        <LandingProgramsSection tr={tr} isHy={isHy} />
        <LandingBranchesSection tr={tr} isHy={isHy} />
        <LandingFollowUsSection tr={tr} isHy={isHy} />
        <LandingGetInTouchSection tr={tr} isHy={isHy} />
        <LandingJoinTeamSection tr={tr} isHy={isHy} />
        <LandingNewsSection tr={tr} isHy={isHy} />
        <LandingFaqSection tr={tr} isHy={isHy} />
        <LandingFooter tr={tr} isHy={isHy} logoUrl={logoUrl} />
      </CanvasScaler>
    </>
  );
}
