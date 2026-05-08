'use client';

import { GraduationCap, Users } from 'lucide-react';
import { DashboardPromoBannerIllustration } from './DashboardPromoBannerIllustration';
import { cn } from '@/shared/lib/utils';

export type DashboardPromoBannerProps = {
  title: string;
  subtitle: string;
  primaryStat: { label: string; value: string };
  secondaryStat: { label: string; value: string };
  className?: string;
};

function StatBadge({
  label,
  value,
  icon,
  accentClass,
}: {
  label: string;
  value: string;
  icon: 'graduation' | 'people';
  accentClass: string;
}) {
  const Icon = icon === 'graduation' ? GraduationCap : Users;
  return (
    <div className="flex min-w-0 items-center gap-[1.125rem]">
      <div
        className={cn(
          'flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center rounded-full border-2 border-white/45',
          accentClass,
        )}
      >
        <Icon className="h-8 w-8 text-white" strokeWidth={2.25} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-white sm:text-xl">{label}</p>
        <p className="text-base font-medium leading-tight text-white/90 sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

export function DashboardPromoBanner({
  title,
  subtitle,
  primaryStat,
  secondaryStat,
  className,
}: DashboardPromoBannerProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-[#5FB9A1] text-white shadow-md shadow-slate-900/10',
        'transition-[transform,box-shadow] duration-300 ease-out will-change-transform',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/15',
        className,
      )}
    >
      <div className="flex flex-col gap-7 px-8 py-[3.75rem] sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:px-12 sm:py-[4.5rem]">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="mt-2.5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl mx-auto sm:mx-0">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-9 gap-y-5 sm:mt-10 sm:justify-start">
            <StatBadge
              label={primaryStat.label}
              value={primaryStat.value}
              icon="graduation"
              accentClass="bg-[#F05479]"
            />
            <StatBadge
              label={secondaryStat.label}
              value={secondaryStat.value}
              icon="people"
              accentClass="bg-[#FFC107]"
            />
          </div>
        </div>
        <div
          className="hidden shrink-0 self-end sm:flex sm:self-center sm:pl-2 md:max-w-[38%]"
          aria-hidden
        >
          <DashboardPromoBannerIllustration />
        </div>
      </div>
    </section>
  );
}
