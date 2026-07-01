'use client';

import { cn } from '@/shared/lib/utils';
import { LandingScrollReveal } from './LandingScrollReveal';

interface LandingSectionHeaderProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
  align?: 'center' | 'left';
}

export function LandingSectionHeader({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  className,
  align = 'center',
}: LandingSectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <LandingScrollReveal className={className}>
      <div className={cn('flex flex-col gap-2', alignClass)}>
        <h2 className={titleClassName}>{title}</h2>
        {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
      </div>
    </LandingScrollReveal>
  );
}
