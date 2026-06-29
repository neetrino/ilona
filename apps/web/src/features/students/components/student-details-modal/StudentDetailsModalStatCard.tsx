'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { portalInnerCardClass } from '@/shared/lib/portal-theme';

type StudentModalStatCardProps = {
  label: string;
  value: string;
  caption: string;
  iconSrc: string;
  iconBg: string;
};

export function StudentDetailsModalStatCard({ label, value, caption, iconSrc, iconBg }: StudentModalStatCardProps) {
  return (
    <div className={portalInnerCardClass}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
        <div
          className={cn(
            'flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem]',
            iconBg,
          )}
        >
          <PublicAssetImage src={iconSrc} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1010a3]">{value}</p>
      <p className="mt-1 text-xs text-[#8b8b90]">{caption}</p>
    </div>
  );
}
