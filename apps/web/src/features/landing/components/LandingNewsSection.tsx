'use client';

import { LandingBlogGrid, LANDING_BLOG_HOME_PREVIEW_COUNT } from './LandingBlogGrid';
import type { LandingSectionProps } from '../types';

export function LandingNewsSection({ tr, isHy }: LandingSectionProps) {
  return (
    <section id="blog" className="scroll-mt-28 bg-[#f9fafb]">
      <LandingBlogGrid
        tr={tr}
        isHy={isHy}
        showViewAllLink
        maxItems={LANDING_BLOG_HOME_PREVIEW_COUNT}
      />
    </section>
  );
}
