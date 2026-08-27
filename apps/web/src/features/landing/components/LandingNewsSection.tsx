'use client';

import { LandingBlogGrid } from './LandingBlogGrid';
import type { LandingSectionProps } from '../types';

export function LandingNewsSection({ tr }: LandingSectionProps) {
  return (
    <section id="blog" className="scroll-mt-28 bg-[#f9fafb]">
      <LandingBlogGrid tr={tr} showViewAllLink />
    </section>
  );
}
