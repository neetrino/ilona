'use client';

import Link from 'next/link';
import { LANDING_BLOG_POSTS } from '../landingBlogContent';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingStaggerGroup } from './LandingStaggerGroup';
import { LandingBlogCard } from './LandingBlogCard';
import type { LandingTr } from '../types';

type LandingBlogGridProps = {
  tr: LandingTr;
  showViewAllLink?: boolean;
};

export function LandingBlogGrid({ tr, showViewAllLink = false }: LandingBlogGridProps) {
  return (
    <>
      <div className="flex flex-col gap-6 pb-10 pt-10 tablet:hidden">
        <LandingSectionHeader
          className="px-5"
          title={tr('Latest News', 'Վերջին նորություններ')}
          subtitle={tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
          titleClassName="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]"
          subtitleClassName="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]"
        />

        <LandingStaggerGroup className="flex flex-col gap-4 px-5">
          {LANDING_BLOG_POSTS.map((post) => (
            <LandingBlogCard key={post.slug} post={post} tr={tr} variant="mobile" />
          ))}
        </LandingStaggerGroup>

        {showViewAllLink ? (
          <div className="px-5">
            <Link
              href="/blog"
              className="inline-flex text-[14px] font-bold leading-[21px] tracking-[-0.2px] text-[#155dfc] transition-opacity hover:opacity-80"
            >
              {tr('View all articles', 'Տեսնել բոլոր հոդվածները')}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="hidden pb-[80px] pt-[80px] tablet:block">
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-[64px] px-6">
          <LandingSectionHeader
            title={tr('Latest News', 'Վերջին նորություններ')}
            subtitle={tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
            titleClassName="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]"
            subtitleClassName="text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]"
          />

          <LandingStaggerGroup className="grid grid-cols-3 gap-8">
            {LANDING_BLOG_POSTS.map((post) => (
              <LandingBlogCard key={post.slug} post={post} tr={tr} variant="desktop" />
            ))}
          </LandingStaggerGroup>

          {showViewAllLink ? (
            <div className="text-center">
              <Link
                href="/blog"
                className="inline-flex text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc] transition-opacity hover:opacity-80"
              >
                {tr('View all articles', 'Տեսնել բոլոր հոդվածները')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
