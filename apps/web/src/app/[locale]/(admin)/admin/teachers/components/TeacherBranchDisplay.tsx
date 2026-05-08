'use client';

import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import type { Center } from '@ilona/types';
import type { useTranslations } from 'next-intl';

interface TeacherBranchDisplayProps {
  centers: Center[];
  t: ReturnType<typeof useTranslations<'teachers'>>;
  /** Table rows: slightly denser text */
  density?: 'default' | 'compact';
  className?: string;
}

export function TeacherBranchDisplay({
  centers,
  t,
  density = 'default',
  className,
}: TeacherBranchDisplayProps) {
  if (centers.length === 0) {
    return (
      <span
        className={cn(
          'text-slate-400 italic',
          density === 'compact' ? 'text-xs' : 'text-xs sm:text-sm'
        )}
      >
        {t('noBranchAssigned')}
      </span>
    );
  }

  if (centers.length === 1) {
    const name = centers[0].name;
    return (
      <span
        className={cn(
          'text-slate-700',
          density === 'compact' ? 'text-sm' : 'text-xs sm:text-sm'
        )}
        title={name}
      >
        {name}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {centers.map((c) => (
        <span key={c.id} className="inline-block max-w-[140px]" title={c.name}>
          <Badge
            variant="default"
            className={cn(
              'block max-w-full truncate font-normal',
              density === 'compact' && 'px-2 py-0.5 text-[11px]'
            )}
          >
            {c.name}
          </Badge>
        </span>
      ))}
    </div>
  );
}
