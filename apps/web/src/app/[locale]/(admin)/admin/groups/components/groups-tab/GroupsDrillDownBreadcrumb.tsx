'use client';

import Link from 'next/link';
import type { GroupsTabState } from './useGroupsTab';

interface GroupsDrillDownBreadcrumbProps {
  locale: string;
  portalBasePath: string;
  centerName: string | undefined;
  t: GroupsTabState['t'];
}

export function GroupsDrillDownBreadcrumb({
  locale,
  portalBasePath,
  centerName,
  t,
}: GroupsDrillDownBreadcrumbProps) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-sm text-[#3b3b40]"
      aria-label={t('breadcrumb')}
    >
      <Link
        href={`/${locale}${portalBasePath}/groups`}
        className="font-medium text-[#1010a3] hover:text-[#1010a3]/80 hover:underline"
      >
        {t('centers')}
      </Link>
      <span className="text-[#8b8b90]" aria-hidden>
        /
      </span>
      <span className="font-medium text-[#3b3b40]">{centerName ?? '…'}</span>
      <span className="text-[#8b8b90]" aria-hidden>
        /
      </span>
      <span className="text-[#8b8b90]">{t('groupsLabel')}</span>
    </nav>
  );
}
