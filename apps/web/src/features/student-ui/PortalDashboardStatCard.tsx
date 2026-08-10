'use client';

import type { ReactNode } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';

export function PortalStatProgressBar({ percent }: { percent: number }) {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f1f2]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#0e0e10] to-[#3b3b40]"
        style={{ width }}
      />
    </div>
  );
}

export type PortalDashboardStatCardProps = {
  label: string;
  valueNode: ReactNode;
  caption: string;
  progress: number;
  badge?: ReactNode;
  iconSrc: string;
  iconBg: string;
};

/** Large dashboard stat card (Student / Teacher home KPIs). */
export function PortalDashboardStatCard({
  label,
  valueNode,
  caption,
  progress,
  badge,
  iconSrc,
  iconBg,
}: PortalDashboardStatCardProps) {
  return (
    <article className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
        <div
          className={`flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem] ${iconBg}`}
        >
          <PublicAssetImage src={iconSrc} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-baseline gap-1">{valueNode}</div>
        {badge}
      </div>
      <p className="mt-2 text-xs text-[#3b3b40]">{caption}</p>
      <PortalStatProgressBar percent={progress} />
    </article>
  );
}
