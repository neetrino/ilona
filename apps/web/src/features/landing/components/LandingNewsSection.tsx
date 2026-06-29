'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, NEWS_IMAGE_1, NEWS_IMAGE_1_OVERLAY, NEWS_IMAGE_2, NEWS_IMAGE_2_OVERLAY, NEWS_IMAGE_3, NEWS_IMAGE_3_OVERLAY, NEWS_ARROW_ICON } from '../landingConstants';
import type { LandingSectionProps } from '../types';

export function LandingNewsSection({ tr }: LandingSectionProps) {

  return (
    <>
      <section className="bg-[#f9fafb]">
        <div className="flex flex-col gap-6 pb-10 pt-10 tablet:hidden">
          <div className="flex flex-col items-center gap-2 px-5 text-center">
            <h2 className="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]">
              {tr('Latest News', 'Վերջին նորություններ')}
            </h2>
            <p className="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]">
              {tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
            </p>
          </div>
      
          <div className="flex flex-col gap-4 px-5">
            {[
              {
                image: NEWS_IMAGE_1,
                overlay: NEWS_IMAGE_1_OVERLAY,
                date: tr('Apr 28, 2026', '28 Ապր, 2026'),
                dateColor: 'text-[#1447e6]',
                title: tr('Summer Intensive', 'Ամառային ինտենսիվ'),
              },
              {
                image: NEWS_IMAGE_2,
                overlay: NEWS_IMAGE_2_OVERLAY,
                date: tr('Apr 15, 2026', '15 Ապր, 2026'),
                dateColor: 'text-[#008236]',
                title: tr('Achievement Awards', 'Հաջողության մրցանակաբաշխություն'),
              },
              {
                image: NEWS_IMAGE_3,
                overlay: NEWS_IMAGE_3_OVERLAY,
                date: tr('Apr 1, 2026', '1 Ապր, 2026'),
                dateColor: 'text-[#8200db]',
                title: tr('New East Branch', 'Նոր արևելյան մասնաճյուղ'),
                imageClassName: 'object-cover object-bottom',
              },
            ].map((article) => (
              <article
                key={article.title}
                className="w-full overflow-hidden rounded-[28px] bg-[#ecf0f7]"
              >
                <div className="relative h-[160px] w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 743px) 100vw, 384px"
                    className={article.imageClassName ?? 'object-cover'}
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
                    <span
                      className={cn(
                        'text-[12px] font-bold leading-[18px] tracking-[-0.15px]',
                        article.dateColor,
                      )}
                    >
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
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold leading-[19.5px] tracking-[-0.31px] text-[#155dfc]"
                  >
                    <span>{tr('Read more', 'Կարդալ ավելին')}</span>
                    <Image src={NEWS_ARROW_ICON} alt="" width={14} height={14} unoptimized />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      
        <div className="hidden pb-[80px] pt-[80px] tablet:block">
          <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-[64px] px-6">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Latest News', 'Վերջին նորություններ')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
            </p>
          </div>
      
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                image: NEWS_IMAGE_1,
                overlay: NEWS_IMAGE_1_OVERLAY,
                date: tr('Apr 28, 2026', '28 Ապր, 2026'),
                dateColor: 'text-[#1447e6]',
                title: tr('Summer Intensive', 'Ամառային ինտենսիվ'),
              },
              {
                image: NEWS_IMAGE_2,
                overlay: NEWS_IMAGE_2_OVERLAY,
                date: tr('Apr 15, 2026', '15 Ապր, 2026'),
                dateColor: 'text-[#008236]',
                title: tr('Achievement Awards', 'Հաջողության մրցանակաբաշխություն'),
              },
              {
                image: NEWS_IMAGE_3,
                overlay: NEWS_IMAGE_3_OVERLAY,
                date: tr('Apr 1, 2026', '1 Ապր, 2026'),
                dateColor: 'text-[#8200db]',
                title: tr('New East Branch', 'Նոր արևելյան մասնաճյուղ'),
                imageClassName: 'object-cover object-bottom',
              },
            ].map((article) => (
              <article
                key={article.title}
                className="h-[419.992px] overflow-hidden rounded-[32px] bg-[#ecf0f7]"
              >
                <div className="relative h-[203.992px] w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 1200px) 100vw, 384px"
                    className={article.imageClassName ?? 'object-cover'}
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
                    className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]"
                  >
                    <span>{tr('Read more', 'Կարդալ ավելին')}</span>
                    <Image src={NEWS_ARROW_ICON} alt="" width={16} height={16} unoptimized />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
