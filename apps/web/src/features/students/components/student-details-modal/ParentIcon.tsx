import type { SVGProps } from 'react';

/** Lucide-style adult + child silhouette — reads as a parent. */
export function ParentIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="8" cy="6.5" r="2.5" />
      <path d="M3.5 20v-1.2A3.8 3.8 0 0 1 7.3 15h1.4a3.8 3.8 0 0 1 3.8 3.8V20" />
      <circle cx="17" cy="9" r="2" />
      <path d="M13.2 20v-.8A3.2 3.2 0 0 1 16.4 16h1.2a3.2 3.2 0 0 1 3.2 3.2V20" />
    </svg>
  );
}
