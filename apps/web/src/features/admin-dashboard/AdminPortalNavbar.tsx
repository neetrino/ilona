'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { LandingMobileNavbarPill } from '@/shared/components/layout/LandingMobileNavbarPill';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { STUDENT_SIDEBAR_ASSETS } from '@/features/student-dashboard/studentSidebarAssets';
import { ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING } from './admin-portal-layout';
import { cn } from '@/shared/lib/utils';

export function AdminPortalNavbar() {
  const t = useTranslations('home.nav');
  const { data: logoData } = useLogo();
  const apiLogo = getFullApiUrl(logoData?.logoUrl);
  const brandLogo = apiLogo || STUDENT_SIDEBAR_ASSETS.brandLogo;

  return (
    <header className={cn('fixed inset-x-0 top-2 z-50 sm:top-3', ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING)}>
      <LandingMobileNavbarPill
        logoUrl={brandLogo}
        brandLabel={t('brand')}
        showLanguageToggle={false}
        enlargeLogoInner
        logoOnError={(event) => {
          const target = event.target as HTMLImageElement;
          if (target.src.includes('student-sidebar')) return;
          target.src = STUDENT_SIDEBAR_ASSETS.brandLogo;
        }}
        trailing={
          <>
            <LanguageSwitcher
              variant="circle"
              className="h-9 w-9 bg-white text-[11px] font-bold text-[#1010a3] hover:bg-[#f3f3f4]"
            />
            <StudentLogoutControl variant="circle" />
          </>
        }
      />
    </header>
  );
}
