'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { usePublicBlogPosts } from '@/features/blog';
import { BUTTON_HOVER_CLASS } from '../landingConstants';
import { mapBlogPostToLandingView } from '../landingBlogContent';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingStaggerGroup } from './LandingStaggerGroup';
import { LandingBlogCard } from './LandingBlogCard';
import type { LandingTr } from '../types';

export const LANDING_BLOG_HOME_PREVIEW_COUNT = 3;

const LANDING_BLOG_SECTION_TITLE_COLOR = {
  default: 'text-[#0a0a0a]',
  brand: 'text-[#093394]',
} as const;

type LandingBlogGridProps = {
  tr: LandingTr;
  isHy: boolean;
  showViewAllLink?: boolean;
  maxItems?: number;
  sectionTitleTone?: keyof typeof LANDING_BLOG_SECTION_TITLE_COLOR;
};

export function LandingBlogGrid({
  tr,
  isHy,
  showViewAllLink = false,
  maxItems,
  sectionTitleTone = 'default',
}: LandingBlogGridProps) {
  const { data: apiPosts = [], isLoading, isError } = usePublicBlogPosts();
  const posts = useMemo(() => {
    const mapped = apiPosts.map(mapBlogPostToLandingView);
    return maxItems != null ? mapped.slice(0, maxItems) : mapped;
  }, [apiPosts, maxItems]);
  const sectionTitleColor = LANDING_BLOG_SECTION_TITLE_COLOR[sectionTitleTone];

  const emptyMessage = isLoading
    ? tr('Loading news…', 'Նորությունները բեռնվում են…')
    : isError
      ? tr('Unable to load news.', 'Չհաջողվեց բեռնել նորությունները։')
      : tr('No news posts yet.', 'Դեռ նորություններ չկան։');

  return (
    <>
      <div className="flex flex-col gap-6 pb-10 pt-10 tablet:hidden">
        <LandingSectionHeader
          className="px-5"
          title={tr('Latest News', 'Վերջին նորություններ')}
          subtitle={tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
          titleClassName={`text-[28px] font-extrabold leading-[42px] tracking-[0.35px] ${sectionTitleColor}`}
          subtitleClassName="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]"
        />

        {posts.length === 0 ? (
          <p className="px-5 text-[15px] text-[#4a5565]">{emptyMessage}</p>
        ) : (
          <LandingStaggerGroup className="flex flex-col gap-4 px-5">
            {posts.map((post) => (
              <LandingBlogCard key={post.slug} post={post} tr={tr} isHy={isHy} variant="mobile" />
            ))}
          </LandingStaggerGroup>
        )}

        {showViewAllLink ? (
          <div className="flex justify-center px-5">
            <Link
              href="/blog"
              className={cn(
                'inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-[#093394] px-8 text-[15px] font-medium leading-[22.5px] tracking-[-0.31px] text-white shadow-lg',
                BUTTON_HOVER_CLASS,
              )}
            >
              <Newspaper className="size-5" strokeWidth={2.25} />
              <span>{tr('View all articles', 'Տեսնել բոլոր հոդվածները')}</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="hidden pb-[80px] pt-[80px] tablet:block">
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-[64px] px-6">
          <LandingSectionHeader
            title={tr('Latest News', 'Վերջին նորություններ')}
            subtitle={tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
            titleClassName={`text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] ${sectionTitleColor}`}
            subtitleClassName="text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]"
          />

          {posts.length === 0 ? (
            <p className="text-[16px] text-[#4a5565]">{emptyMessage}</p>
          ) : (
            <LandingStaggerGroup className="grid grid-cols-3 items-start gap-x-8 gap-y-8">
              {posts.map((post) => (
                <LandingBlogCard key={post.slug} post={post} tr={tr} isHy={isHy} variant="desktop" />
              ))}
            </LandingStaggerGroup>
          )}

          {showViewAllLink ? (
            <div className="flex justify-center">
              <Link
                href="/blog"
                className={cn(
                  'inline-flex h-[56px] items-center justify-center gap-2 rounded-[80px] bg-[#093394] px-8 text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-white shadow-lg',
                  BUTTON_HOVER_CLASS,
                )}
              >
                <Newspaper className="size-[26px]" strokeWidth={2.25} />
                <span>{tr('View all articles', 'Տեսնել բոլոր հոդվածները')}</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
