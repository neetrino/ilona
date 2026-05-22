'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { portalCardClass, portalSectionTitleClass } from '@/shared/lib/portal-theme';

type PortalDashboardSectionProps = {
  title: string;
  children: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  headerClassName?: string;
};

/** Card section shell for portal dashboards (student / teacher / admin). */
export function PortalDashboardSection({
  title,
  children,
  viewAllHref,
  viewAllLabel,
  className,
  headerClassName,
}: PortalDashboardSectionProps) {
  return (
    <section className={cn(portalCardClass, className)}>
      <header className={cn('mb-4 flex flex-wrap items-center justify-between gap-2', headerClassName)}>
        <h2 className={portalSectionTitleClass}>{title}</h2>
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-[#1010a3] transition-opacity hover:opacity-80"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}
