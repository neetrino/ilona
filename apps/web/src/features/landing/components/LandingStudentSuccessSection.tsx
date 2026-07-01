'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, STUDENT_SUCCESS_IMAGE } from '../landingConstants';
import { LANDING_PREMIUM_CARD_CLASS } from '../landingAnimations';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingScrollReveal } from './LandingScrollReveal';
import { LandingStaggerArticle, LandingStaggerGroup } from './LandingStaggerGroup';
import type { LandingSectionProps } from '../types';

export function LandingStudentSuccessSection({ tr }: LandingSectionProps) {
  return (
    <section className="bg-[#f9fafb]">
      <div className="flex flex-col gap-6 pb-10 pt-10 tablet:hidden">
        <LandingSectionHeader
          className="px-5"
          title={tr('Student Success', 'Ուսանողների հաջողություններ')}
          subtitle={tr('Real stories, real results', 'Իրական պատմություններ, իրական արդյունքներ')}
          titleClassName="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]"
          subtitleClassName="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]"
        />

        <LandingStaggerGroup className="flex flex-col gap-4 px-5">
          {[1, 2, 3].map((item) => (
            <LandingStaggerArticle
              key={item}
              className={cn(
                'w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
                LANDING_PREMIUM_CARD_CLASS,
              )}
            >
              <div className="relative h-[200px] w-full overflow-hidden bg-[#101828]">
                <div className="absolute inset-x-0 -top-6 h-[254px]">
                  <Image
                    src={STUDENT_SUCCESS_IMAGE}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 743px) 100vw, 280px"
                    className="object-cover object-[center_52%]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 px-5 pb-5 pt-5">
                <h3 className="text-[16px] font-medium leading-[24px] tracking-[-0.44px] text-[#101828]">
                  {tr('Maria&apos;s IELTS Success', 'Մարիայի IELTS հաջողությունը')}
                </h3>
                <p className="text-[13px] leading-[20px] tracking-[-0.15px] text-[#4a5565]">
                  {tr('From beginner to IELTS 7.5 in 12 months', 'Սկսնակից մինչև IELTS 7.5՝ 12 ամսում')}
                </p>
              </div>
            </LandingStaggerArticle>
          ))}
        </LandingStaggerGroup>

        <LandingScrollReveal className="flex justify-center px-5" delay={0.12}>
          <Link
            href="#contact"
            className={cn(
              'inline-flex h-[50px] w-[180.633px] items-center justify-center rounded-full bg-[#093394] text-[15px] font-semibold leading-[22.5px] text-white',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('More', 'Ավելին')}
          </Link>
        </LandingScrollReveal>
      </div>

      <div className="hidden pb-[80px] pt-[80px] tablet:block">
        <div className="mx-auto flex w-full max-w-[1216px] flex-col items-center gap-[50px] px-6">
          <LandingSectionHeader
            title={tr('Student Success', 'Ուսանողների հաջողություններ')}
            subtitle={tr('Real stories, real results', 'Իրական պատմություններ, իրական արդյունքներ')}
            titleClassName="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]"
            subtitleClassName="text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]"
          />

          <LandingStaggerGroup className="grid w-full grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <LandingStaggerArticle
                key={item}
                className={cn(
                  'overflow-hidden rounded-[16px] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
                  LANDING_PREMIUM_CARD_CLASS,
                )}
              >
                <div className="relative h-[216px] w-full overflow-hidden bg-[#101828]">
                  <Image
                    src={STUDENT_SUCCESS_IMAGE}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-6 pb-6 pt-5">
                  <h3 className="text-[28px] font-medium leading-[28px] tracking-[-0.4395px] text-[#101828]">
                    {tr('Maria&apos;s IELTS Success', 'Մարիայի IELTS հաջողությունը')}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#4a5565]">
                    {tr('From beginner to IELTS 7.5 in 12 months', 'Սկսնակից մինչև IELTS 7.5՝ 12 ամսում')}
                  </p>
                </div>
              </LandingStaggerArticle>
            ))}
          </LandingStaggerGroup>

          <LandingScrollReveal delay={0.16}>
            <Link
              href="#contact"
              className={cn(
                'inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#093394] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('More', 'Ավելին')}
            </Link>
          </LandingScrollReveal>
        </div>
      </div>
    </section>
  );
}
