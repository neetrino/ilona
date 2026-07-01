'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import {
  NEWS_IMAGE_1,
  NEWS_IMAGE_1_OVERLAY,
  NEWS_IMAGE_2,
  NEWS_IMAGE_2_OVERLAY,
  NEWS_IMAGE_3,
  NEWS_IMAGE_3_OVERLAY,
  NEWS_ARROW_ICON,
} from '../landingConstants';
import { LANDING_PREMIUM_CARD_CLASS } from '../landingAnimations';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingStaggerArticle, LandingStaggerGroup } from './LandingStaggerGroup';
import type { LandingSectionProps } from '../types';

const NEWS_ARTICLES = [
  {
    image: NEWS_IMAGE_1,
    overlay: NEWS_IMAGE_1_OVERLAY,
    dateEn: 'Apr 28, 2026',
    dateHy: '28 Ապր, 2026',
    dateColor: 'text-[#1447e6]',
    titleEn: 'Summer Intensive',
    titleHy: 'Ամառային ինտենսիվ',
  },
  {
    image: NEWS_IMAGE_2,
    overlay: NEWS_IMAGE_2_OVERLAY,
    dateEn: 'Apr 15, 2026',
    dateHy: '15 Ապր, 2026',
    dateColor: 'text-[#008236]',
    titleEn: 'Achievement Awards',
    titleHy: 'Հաջողության մրցանակաբաշխություն',
  },
  {
    image: NEWS_IMAGE_3,
    overlay: NEWS_IMAGE_3_OVERLAY,
    dateEn: 'Apr 1, 2026',
    dateHy: '1 Ապր, 2026',
    dateColor: 'text-[#8200db]',
    titleEn: 'New East Branch',
    titleHy: 'Նոր արևելյան մասնաճյուղ',
    imageClassName: 'object-cover object-bottom',
  },
] as const;

export function LandingNewsSection({ tr }: LandingSectionProps) {
  const articles = NEWS_ARTICLES.map((article) => ({
    image: article.image,
    overlay: article.overlay,
    date: tr(article.dateEn, article.dateHy),
    dateColor: article.dateColor,
    title: tr(article.titleEn, article.titleHy),
    imageClassName: 'imageClassName' in article ? article.imageClassName : undefined,
  }));

  return (
    <section id="blog" className="scroll-mt-28 bg-[#f9fafb]">
      <div className="flex flex-col gap-6 pb-10 pt-10 tablet:hidden">
        <LandingSectionHeader
          className="px-5"
          title={tr('Latest News', 'Վերջին նորություններ')}
          subtitle={tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
          titleClassName="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]"
          subtitleClassName="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]"
        />

        <LandingStaggerGroup className="flex flex-col gap-4 px-5">
          {articles.map((article) => (
            <LandingStaggerArticle
              key={article.title}
              className={cn('w-full overflow-hidden rounded-[28px] bg-[#ecf0f7]', LANDING_PREMIUM_CARD_CLASS)}
            >
              <div className="relative h-[160px] w-full overflow-hidden">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 743px) 100vw, 384px"
                  className={cn('transition-transform duration-700 ease-out', article.imageClassName ?? 'object-cover')}
                />
                <Image
                  src={article.overlay}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 743px) 100vw, 384px"
                  className={article.imageClassName ?? 'object-cover'}
                />
              </div>
              <div className="flex flex-col px-5 pb-5 pt-5">
                <div className="inline-flex h-7 w-fit items-center rounded-full bg-white px-3">
                  <span className={cn('text-[12px] font-bold leading-[18px] tracking-[-0.15px]', article.dateColor)}>
                    {article.date}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-bold leading-[27px] tracking-[0.07px] text-[#0a0a0a]">
                  {article.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[19.5px] tracking-[-0.31px] text-[#4a5565]">
                  {tr('Read more about this...', 'Կարդալ ավելին...')}
                </p>
                <Link
                  href="#"
                  className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold leading-[19.5px] tracking-[-0.31px] text-[#155dfc] transition-opacity hover:opacity-80"
                >
                  <span>{tr('Read more', 'Կարդալ ավելին')}</span>
                  <Image src={NEWS_ARROW_ICON} alt="" width={14} height={14} unoptimized />
                </Link>
              </div>
            </LandingStaggerArticle>
          ))}
        </LandingStaggerGroup>
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
            {articles.map((article) => (
              <LandingStaggerArticle
                key={article.title}
                className={cn('h-[419.992px] overflow-hidden rounded-[32px] bg-[#ecf0f7]', LANDING_PREMIUM_CARD_CLASS)}
              >
                <div className="relative h-[203.992px] w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 1200px) 100vw, 384px"
                    className={cn('transition-transform duration-700 ease-out', article.imageClassName ?? 'object-cover')}
                  />
                  <Image
                    src={article.overlay}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 1200px) 100vw, 384px"
                    className={article.imageClassName ?? 'object-cover'}
                  />
                </div>

                <div className="px-8 pb-8 pt-8">
                  <div className="inline-flex h-[28px] items-center rounded-full bg-white px-4">
                    <span className={cn('text-[14px] font-bold leading-[20px] tracking-[-0.1504px]', article.dateColor)}>
                      {article.date}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[24px] font-bold leading-[32px] tracking-[0.0703px] text-[#0a0a0a]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    {tr('Read more about this...', 'Կարդալ ավելին...')}
                  </p>
                  <Link
                    href="#"
                    className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc] transition-opacity hover:opacity-80"
                  >
                    <span>{tr('Read more', 'Կարդալ ավելին')}</span>
                    <Image src={NEWS_ARROW_ICON} alt="" width={16} height={16} unoptimized />
                  </Link>
                </div>
              </LandingStaggerArticle>
            ))}
          </LandingStaggerGroup>
        </div>
      </div>
    </section>
  );
}
