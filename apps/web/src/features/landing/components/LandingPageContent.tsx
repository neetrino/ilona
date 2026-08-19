'use client';

import dynamic from 'next/dynamic';
import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';
import { LandingCanvasScaleRuntime } from '@/shared/components/layout/LandingCanvasScaleInit';
import { CanvasScaler } from '@/shared/components/layout/CanvasScaler';
import { useLandingTr } from '../hooks/useLandingTr';
import { useLandingActiveSection } from '../hooks/useLandingActiveSection';
import { useScrollPositionRestore } from '../hooks/useScrollPositionRestore';
import { LANDING_NAV_SECTION_IDS } from '../landingNav';
import { LandingHeroSection } from './LandingHeroSection';
import { LandingAboutSection } from './LandingAboutSection';
import { LandingWhyChooseSection } from './LandingWhyChooseSection';
import { LandingSectionPlaceholder } from './LandingSectionPlaceholder';
import { LandingRocketFlight } from './LandingRocketFlight';

const LandingStudentSuccessSection = dynamic(
  () =>
    import('./LandingStudentSuccessSection').then((module) => ({
      default: module.LandingStudentSuccessSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[520px]" /> },
);

const LandingProgramsSection = dynamic(
  () =>
    import('./LandingProgramsSection').then((module) => ({
      default: module.LandingProgramsSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[560px]" /> },
);

const LandingBranchesSection = dynamic(
  () =>
    import('./LandingBranchesSection').then((module) => ({
      default: module.LandingBranchesSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[640px] bg-[#093394]" /> },
);

const LandingFollowUsSection = dynamic(
  () =>
    import('./LandingFollowUsSection').then((module) => ({
      default: module.LandingFollowUsSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[480px]" /> },
);

const LandingGetInTouchSection = dynamic(
  () =>
    import('./LandingGetInTouchSection').then((module) => ({
      default: module.LandingGetInTouchSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[320px]" /> },
);

const LandingJoinTeamSection = dynamic(
  () =>
    import('./LandingJoinTeamSection').then((module) => ({
      default: module.LandingJoinTeamSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[520px] bg-[#1c398e]" /> },
);

const LandingNewsSection = dynamic(
  () =>
    import('./LandingNewsSection').then((module) => ({
      default: module.LandingNewsSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[560px]" /> },
);

const LandingFaqSection = dynamic(
  () =>
    import('./LandingFaqSection').then((module) => ({
      default: module.LandingFaqSection,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[480px] bg-[#ecf0f7]" /> },
);

const LandingFooter = dynamic(
  () =>
    import('./LandingFooter').then((module) => ({
      default: module.LandingFooter,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[280px] bg-black" /> },
);

export function LandingPageContent() {
  const { tr, isHy } = useLandingTr();
  const { isAuthenticated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const profileHref = isAuthenticated && user ? getPortalEntryPath(user.role) : '/login';
  const { activeSection, scrollToSection } = useLandingActiveSection(LANDING_NAV_SECTION_IDS, true);
  useScrollPositionRestore();

  return (
    <>
      <LandingCanvasScaleRuntime />
      <LandingNavbar
        logoUrl={logoUrl}
        profileHref={profileHref}
        activeSection={activeSection}
        onSectionNavigate={scrollToSection}
      />
      <LandingRocketFlight />
      <CanvasScaler className="min-h-screen">
        <LandingHeroSection tr={tr} isHy={isHy} onSectionNavigate={scrollToSection} />
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
