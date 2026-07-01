'use client';

import { cn } from '@/shared/lib/utils';

interface LandingSectionPlaceholderProps {
  className?: string;
}

export function LandingSectionPlaceholder({ className }: LandingSectionPlaceholderProps) {
  return (
    <div
      className={cn('min-h-[320px] animate-pulse bg-[#f9fafb]', className)}
      aria-hidden
    />
  );
}
