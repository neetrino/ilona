import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const ICON_STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 8 / 3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function AboutStatIcon({
  className,
  colorClassName,
  children,
}: {
  className?: string;
  colorClassName: string;
  children: ReactNode;
}) {
  return (
    <svg
      aria-hidden
      className={cn('size-8 shrink-0', colorClassName, className)}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function AboutSuccessIcon({ className }: { className?: string }) {
  return (
    <AboutStatIcon className={className} colorClassName="text-[#F0B100]">
      <path
        d="M7.999 12.001H5.999C5.115 12.001 4.267 11.65 3.642 11.024C3.017 10.399 2.666 9.551 2.666 8.667C2.666 7.783 3.017 6.935 3.642 6.31C4.267 5.685 5.115 5.334 5.999 5.334H7.999"
        {...ICON_STROKE}
      />
      <path
        d="M24 12.001H26C26.884 12.001 27.732 11.65 28.357 11.024C28.982 10.399 29.333 9.551 29.333 8.667C29.333 7.783 28.982 6.935 28.357 6.31C27.732 5.685 26.884 5.334 26 5.334H24"
        {...ICON_STROKE}
      />
      <path d="M5.334 29.334H26.667" {...ICON_STROKE} />
      <path
        d="M13.334 19.547V22.667C13.334 23.4 12.707 23.974 12.041 24.28C10.467 25 9.334 26.987 9.334 29.334"
        {...ICON_STROKE}
      />
      <path
        d="M18.666 19.547V22.667C18.666 23.4 19.293 23.974 19.959 24.28C21.533 25 22.666 26.987 22.666 29.334"
        {...ICON_STROKE}
      />
      <path
        d="M24 2.666H8V12C8 14.121 8.843 16.156 10.343 17.656C11.843 19.157 13.878 20 16 20C18.122 20 20.157 19.157 21.657 17.656C23.157 16.156 24 14.121 24 12V2.666Z"
        {...ICON_STROKE}
      />
    </AboutStatIcon>
  );
}

export function AboutBranchesIcon({ className }: { className?: string }) {
  return (
    <AboutStatIcon className={className} colorClassName="text-[#2B7FFF]">
      <path
        d="M16 29.333C23.364 29.333 29.333 23.364 29.333 16C29.333 8.636 23.364 2.666 16 2.666C8.636 2.666 2.666 8.636 2.666 16C2.666 23.364 8.636 29.333 16 29.333Z"
        {...ICON_STROKE}
      />
      <path
        d="M16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24Z"
        {...ICON_STROKE}
      />
      <path
        d="M16.001 18.667C17.473 18.667 18.667 17.473 18.667 16.001C18.667 14.528 17.473 13.334 16.001 13.334C14.528 13.334 13.334 14.528 13.334 16.001C13.334 17.473 14.528 18.667 16.001 18.667Z"
        {...ICON_STROKE}
      />
    </AboutStatIcon>
  );
}
