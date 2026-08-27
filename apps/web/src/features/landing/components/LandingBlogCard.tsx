'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { NEWS_ARROW_ICON } from '../landingConstants';
import { LANDING_PREMIUM_CARD_CLASS } from '../landingAnimations';
import { LandingStaggerArticle } from './LandingStaggerGroup';
import type { LandingBlogPost } from '../landingBlogContent';
import type { LandingTr } from '../types';

type LandingBlogCardProps = {
  post: LandingBlogPost;
  tr: LandingTr;
  variant: 'mobile' | 'desktop';
};

function localizePost(post: LandingBlogPost, tr: LandingTr) {
  return {
    slug: post.slug,
    image: post.image,
    overlay: post.overlay,
    date: tr(post.dateEn, post.dateHy),
    dateColor: post.dateColor,
    title: tr(post.titleEn, post.titleHy),
    excerpt: tr(post.excerptEn, post.excerptHy),
    imageClassName: post.imageClassName,
  };
}

export function LandingBlogCard({ post, tr, variant }: LandingBlogCardProps) {
  const article = localizePost(post, tr);
  const href = `/blog/${article.slug}`;
  const isMobile = variant === 'mobile';

  return (
    <LandingStaggerArticle
      className={cn(
        'overflow-hidden rounded-[28px] bg-[#ecf0f7]',
        LANDING_PREMIUM_CARD_CLASS,
        isMobile ? 'w-full' : 'h-[419.992px] w-full rounded-[32px]',
      )}
    >
      <Link
        href={href}
        className="group flex h-full flex-col"
        aria-label={tr(`Read more about ${article.title}`, `Կարդալ ավելին «${article.title}» մասին`)}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden',
            isMobile ? 'h-[160px]' : 'h-[203.992px]',
          )}
        >
          <Image
            src={article.image}
            alt=""
            fill
            unoptimized
            loading="lazy"
            sizes={isMobile ? '(max-width: 743px) 100vw, 384px' : '(max-width: 1200px) 100vw, 384px'}
            className={cn(
              'transition-transform duration-700 ease-out group-hover:scale-105',
              article.imageClassName ?? 'object-cover',
            )}
          />
          <Image
            src={article.overlay}
            alt=""
            fill
            unoptimized
            loading="lazy"
            sizes={isMobile ? '(max-width: 743px) 100vw, 384px' : '(max-width: 1200px) 100vw, 384px'}
            className={article.imageClassName ?? 'object-cover'}
          />
        </div>

        <div className={cn('flex flex-1 flex-col', isMobile ? 'px-5 pb-5 pt-5' : 'px-8 pb-8 pt-8')}>
          <div
            className={cn(
              'inline-flex w-fit items-center rounded-full bg-white',
              isMobile ? 'h-7 px-3' : 'h-[28px] px-4',
            )}
          >
            <span
              className={cn(
                'font-bold',
                article.dateColor,
                isMobile
                  ? 'text-[12px] leading-[18px] tracking-[-0.15px]'
                  : 'text-[14px] leading-[20px] tracking-[-0.1504px]',
              )}
            >
              {article.date}
            </span>
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
              'text-[#4a5565]',
              isMobile
                ? 'mt-2 text-[13px] leading-[19.5px] tracking-[-0.31px]'
                : 'mt-3 text-[16px] leading-[24px] tracking-[-0.3125px]',
            )}
          >
            {article.excerpt}
          </p>

          <span
            className={cn(
              'inline-flex items-center gap-2 font-bold text-[#155dfc] transition-opacity group-hover:opacity-80',
              isMobile
                ? 'mt-3 text-[13px] leading-[19.5px] tracking-[-0.31px]'
                : 'mt-auto text-[16px] leading-[24px] tracking-[-0.3125px]',
            )}
          >
            <span>{tr('Read more', 'Կարդալ ավելին')}</span>
            <Image src={NEWS_ARROW_ICON} alt="" width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} unoptimized />
          </span>
        </div>
      </Link>
    </LandingStaggerArticle>
  );
}
