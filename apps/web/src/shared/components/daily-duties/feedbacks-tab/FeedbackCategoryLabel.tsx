'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type FeedbackCategoryTone = 'violet' | 'sky' | 'lime' | 'amber' | 'rose';

const toneClass: Record<FeedbackCategoryTone, string> = {
  violet: 'bg-[#e8e8fc] text-[#1010a3]',
  sky: 'bg-[#ddecff] text-[#1010a3]',
  lime: 'bg-[#dffc76] text-[#3b3b40]',
  amber: 'bg-[#ffeb8c] text-[#8b4a00]',
  rose: 'bg-[#ffe1e1] text-[#b42318]',
};

interface FeedbackCategoryLabelProps {
  icon: LucideIcon;
  children: string;
  tone?: FeedbackCategoryTone;
  htmlFor?: string;
  className?: string;
  as?: 'label' | 'span';
}

export function FeedbackCategoryLabel({
  icon: Icon,
  children,
  tone = 'violet',
  htmlFor,
  className,
  as = 'label',
}: FeedbackCategoryLabelProps) {
  const Tag = as;

  return (
    <Tag
      htmlFor={as === 'label' ? htmlFor : undefined}
      className={cn(
        'flex min-w-0 items-center gap-2 text-sm font-bold text-[#3b3b40] sm:gap-2.5',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.875rem] sm:h-8 sm:w-8',
          toneClass[tone],
        )}
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 break-words leading-snug">{children}</span>
    </Tag>
  );
}
