'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

export function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export interface AvatarProps {
  /** Image URL (e.g. teacher.user.avatarUrl). When missing or on error, initials are shown. */
  src?: string | null;
  /** Full name for fallback initials (e.g. "John Doe" → "JD"). */
  name: string;
  /** Size preset. Default `md`. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Extra class for the wrapper. */
  className?: string;
  /** Alt text for the image. Defaults to name. */
  alt?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

export function Avatar({ src, name, size = 'md', className, alt = name }: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImage = Boolean(src && !imgFailed);
  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden',
        showImage ? 'bg-slate-100' : 'bg-slate-200 text-slate-600',
        sizeClass,
        className
      )}
      role="img"
      aria-label={name}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={alt}
          width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 80}
          height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 80}
          className="w-full h-full object-cover"
          unoptimized
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
