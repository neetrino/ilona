'use client';

import Image from 'next/image';
import Link from 'next/link';
import { StudentSidebarNavIcon } from '@/shared/components/layout/StudentSidebarNavIcon';
import { cn } from '@/shared/lib/utils';
import type { AdminNavIcon } from '@/shared/lib/admin-nav-entries';

type AdminPortalNavCardProps = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

function AdminPortalNavCardIcon({ icon }: { icon: AdminNavIcon }) {
  if (icon.type === 'sidebar') {
    return <StudentSidebarNavIcon icon={icon.icon} active={false} />;
  }

  if (icon.type === 'image') {
    return (
      <Image
        src={icon.src}
        alt=""
        width={icon.width ?? 28}
        height={icon.height ?? 28}
        className="h-7 w-7 object-contain"
      />
    );
  }

  return (
    <svg className="h-7 w-7 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {icon.paths.split('|').map((d) => (
        <path key={d.slice(0, 12)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
      ))}
    </svg>
  );
}

export function AdminPortalNavCard({ href, label, icon }: AdminPortalNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[1.25rem]',
        'border border-[rgba(14,14,16,0.07)] bg-white p-3',
        'transition-transform active:scale-[0.98]',
      )}
    >
      <AdminPortalNavCardIcon icon={icon} />
      <span className="line-clamp-2 text-center text-xs font-medium leading-snug text-[#242427]">
        {label}
      </span>
    </Link>
  );
}
