'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, FOLLOW_INSTAGRAM_ICON, FOLLOW_FACEBOOK_ICON, FOLLOW_TELEGRAM_ICON } from '../landingConstants';
import { followMobileCardBase, followMobileCardHy, followMobileCardSubtitleBase, followMobileCardSubtitleHy } from '../landingStyles';
import type { LandingSectionProps } from '../types';

export function LandingFollowUsSection({ tr, isHy }: LandingSectionProps) {

  return (
    <>
      <section className="bg-[#f9fafb] pb-10 pt-10 tablet:bg-white tablet:pb-[80px] tablet:pt-[80px]">
        <div className="flex flex-col gap-6 px-5 tablet:hidden">
          <div className="text-center">
            <h2 className="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]">
              {tr('Follow Us', 'Հետևեք մեզ')}
            </h2>
            <p className="mt-2 text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]">
              {tr('Join the community', 'Միացեք համայնքին')}
            </p>
          </div>
      
          <div className="flex flex-col gap-4">
            <motion.article
              className={cn(
                isHy ? followMobileCardHy : followMobileCardBase,
                'rounded-[28px] bg-gradient-to-br from-[#ad46ff] to-[#f6339a]',
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image src={FOLLOW_INSTAGRAM_ICON} alt="" width={40} height={40} unoptimized className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate whitespace-nowrap text-[18px] font-bold leading-[27px] tracking-[0.07px] text-white">
                  {tr('Instagram', 'Instagram')}
                </h3>
                <p className={isHy ? followMobileCardSubtitleHy : followMobileCardSubtitleBase}>
                  {tr('Daily tips & stories', 'Օրական խորհուրդներ և պատմություններ')}
                </p>
              </div>
              <a
                href="https://www.instagram.com/ilona.english.center/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[11px] font-bold leading-[16px] tracking-[-0.31px] text-[#e60076]',
                  BUTTON_HOVER_CLASS,
                )}
              >
                @ilonaenglish
              </a>
            </motion.article>
      
            <motion.article
              className={cn(
                isHy ? followMobileCardHy : followMobileCardBase,
                'rounded-[28px] bg-[#0058df]',
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image src={FOLLOW_FACEBOOK_ICON} alt="" width={40} height={40} unoptimized className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate whitespace-nowrap text-[18px] font-bold leading-[27px] tracking-[0.07px] text-white">
                  {tr('Facebook', 'Facebook')}
                </h3>
                <p className={isHy ? followMobileCardSubtitleHy : followMobileCardSubtitleBase}>
                  {tr('Events & news', 'Իրադարձություններ և նորություններ')}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[11px] font-bold leading-[16px] tracking-[-0.31px] text-[#155dfc]',
                  BUTTON_HOVER_CLASS,
                )}
              >
                Ilona English
              </button>
            </motion.article>
      
            <motion.article
              className={cn(
                isHy ? followMobileCardHy : followMobileCardBase,
                'rounded-[28px] bg-[#3ac2fd]',
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image src={FOLLOW_TELEGRAM_ICON} alt="" width={40} height={40} unoptimized className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate whitespace-nowrap text-[18px] font-bold leading-[27px] tracking-[0.07px] text-white">
                  {tr('Telegram', 'Telegram')}
                </h3>
                <p className={isHy ? followMobileCardSubtitleHy : followMobileCardSubtitleBase}>
                  {tr('Resources', 'Ռեսուրսներ')}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[11px] font-bold leading-[16px] tracking-[-0.31px] text-[#27abe4]',
                  BUTTON_HOVER_CLASS,
                )}
              >
                t.me/iecenglish
              </button>
            </motion.article>
          </div>
        </div>
      
        <div className="mx-auto hidden w-full max-w-[1216px] flex-col gap-[64px] px-6 tablet:flex">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Follow Us', 'Հետևեք մեզ')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Join the community', 'Միացեք համայնքին')}
            </p>
          </div>
      
          <div className="grid grid-cols-[repeat(3,minmax(0,360px))] justify-center gap-8">
            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ad46ff] to-[#f6339a]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_INSTAGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Instagram', 'Instagram')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Daily tips & stories', 'Օրական խորհուրդներ և պատմություններ')}
                </p>
                <a
                  href="https://www.instagram.com/ilona.english.center/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[156px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#e60076]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  @ilonaenglish
                </a>
              </div>
            </motion.article>
      
            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-[#0058df]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_FACEBOOK_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Facebook', 'Facebook')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Events & news', 'Իրադարձություններ և նորություններ')}
                </p>
                <button
                  type="button"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[146px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  Ilona English
                </button>
              </div>
            </motion.article>
      
            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-[#3ac2fd]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_TELEGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Telegram', 'Telegram')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Resources', 'Ռեսուրսներ')}
                </p>
                <button
                  type="button"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[167px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#27abe4]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  t.me/iecenglish
                </button>
              </div>
            </motion.article>
          </div>
        </div>
      </section>
    </>
  );
}
