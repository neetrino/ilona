'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
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
      <div className="flex h-[58px] w-full items-center justify-between rounded-[100px] bg-[#093394] px-3 shadow-lg sm:h-[64px] sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2 sm:gap-3">
          <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/40 sm:h-[48px] sm:w-[48px]">
            <Image
              src={brandLogo}
              alt={t('brand')}
              fill
              className="object-contain"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('student-sidebar')) return;
                target.src = STUDENT_SIDEBAR_ASSETS.brandLogo;
              }}
            />
          </div>
          <span className="min-w-0 truncate text-[14px] font-bold tracking-[-0.18px] text-white min-[420px]:text-[16px] sm:text-[18px]">
            {t('brand')}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher
            variant="circle"
            className="h-9 w-9 bg-white text-[11px] font-bold text-[#1010a3] hover:bg-[#f3f3f4]"
          />
          <StudentLogoutControl variant="circle" />
        </div>
      </div>
    </header>
  );
}
