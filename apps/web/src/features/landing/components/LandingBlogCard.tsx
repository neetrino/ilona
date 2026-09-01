'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { NEWS_ARROW_ICON } from '../landingConstants';
import { LANDING_PREMIUM_CARD_CLASS } from '../landingAnimations';
import { LandingStaggerArticle } from './LandingStaggerGroup';
import { formatLandingBlogDate, type LandingBlogPostView } from '../landingBlogContent';
import type { LandingTr } from '../types';

type LandingBlogCardProps = {
  post: LandingBlogPostView;
  tr: LandingTr;
  variant: 'mobile' | 'desktop';
  isHy: boolean;
  priority?: boolean;
};

function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/);

  return match?.[0].trim() ?? trimmed;
}

function localizePost(post: LandingBlogPostView, tr: LandingTr, isHy: boolean) {
  const preview = getFirstSentence(tr(post.bodyEn[0] ?? '', post.bodyHy[0] ?? ''));

  return {
    slug: post.slug,
    image: post.image,
    date: formatLandingBlogDate(post.publishedAt, isHy),
    dateColor: post.dateColor,
    title: tr(post.titleEn, post.titleHy),
    preview,
    imageClassName: post.imageClassName,
  };
}

export function LandingBlogCard({
  post,
  tr,
  variant,
  isHy,
  priority = false,
}: LandingBlogCardProps) {
  const article = localizePost(post, tr, isHy);
  const href = `/blog/${article.slug}`;
  const isMobile = variant === 'mobile';

  return (
    <LandingStaggerArticle
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[28px] bg-[#ecf0f7]',
        LANDING_PREMIUM_CARD_CLASS,
        isMobile ? 'w-full' : 'min-h-[420px] w-full rounded-[32px]',
      )}
    >
      <Link
        href={href}
        className="group flex h-full min-h-0 flex-col"
        aria-label={tr(`Read more about ${article.title}`, `Կարդալ ավելին «${article.title}» մասին`)}
      >
        <div
          className={cn(
            'relative w-full shrink-0 overflow-hidden bg-[#dbe2ee]',
            isMobile ? 'h-[160px]' : 'h-[204px]',
          )}
        >
          <Image
            src={article.image}
            alt=""
            fill
            unoptimized
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            sizes={isMobile ? '(max-width: 743px) 100vw, 384px' : '(max-width: 1200px) 100vw, 384px'}
            className={cn(
              'object-cover transition-transform duration-700 ease-out group-hover:scale-105',
              article.imageClassName,
            )}
          />
        </div>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            isMobile ? 'px-5 pb-5 pt-5' : 'px-8 pb-8 pt-8',
          )}
        >
          <div className={cn('flex h-7 shrink-0 items-center', isMobile ? '' : 'h-[28px]')}>
            <div
              className={cn(
                'inline-flex h-full items-center rounded-full bg-white shadow-[0_1px_2px_rgba(9,51,148,0.06)] ring-1 ring-[#dbe2ee]',
                isMobile ? 'px-3' : 'px-4',
              )}
            >
              <span
                className={cn(
                  'font-bold tabular-nums',
                  article.dateColor,
                  isMobile
                    ? 'text-[12px] leading-[18px] tracking-[-0.15px]'
                    : 'text-[14px] leading-[20px] tracking-[-0.1504px]',
                )}
              >
                {article.date}
              </span>
            </div>
          </div>

          <h3
            className={cn(
              'mt-4 font-bold text-[#093394]',
              isMobile
                ? 'text-[18px] leading-[27px] tracking-[0.07px]'
                : 'text-[24px] leading-[32px] tracking-[0.0703px]',
            )}
          >
            {article.title}
          </h3>

          <p
            className={cn(
              'line-clamp-2 text-[#4a5565]',
              isMobile
                ? 'mt-2 text-[13px] leading-[19.5px] tracking-[-0.31px]'
                : 'mt-3 text-[16px] leading-[24px] tracking-[-0.3125px]',
            )}
          >
            {article.preview}
          </p>

          <div
            className={cn(
              'flex justify-end',
              isMobile ? 'mt-3' : 'mt-auto pt-4',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center gap-2 font-bold text-[#155dfc] transition-opacity group-hover:opacity-80',
                isMobile
                  ? 'text-[13px] leading-[19.5px] tracking-[-0.31px]'
                  : 'text-[16px] leading-[24px] tracking-[-0.3125px]',
              )}
            >
              <span>{tr('Read more', 'Կարդալ ավելին')}</span>
              <Image
                src={NEWS_ARROW_ICON}
                alt=""
                width={isMobile ? 14 : 16}
                height={isMobile ? 14 : 16}
                unoptimized
              />
            </span>
          </div>
        </div>
      </Link>
    </LandingStaggerArticle>
  );
}
