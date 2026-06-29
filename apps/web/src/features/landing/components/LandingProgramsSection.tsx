'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, REGISTER_ARROW_IMAGE } from '../landingConstants';
import type { LandingSectionProps } from '../types';

export function LandingProgramsSection({ tr, isHy }: LandingSectionProps) {
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);

  return (
    <>
      <section className="bg-[#f9fafb] pb-10 pt-10 tablet:pb-8 tablet:pt-14">
        <div className="flex flex-col gap-6 tablet:hidden">
          <h2 className="px-5 text-center text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]">
            {tr('Student Success', 'Ուսանողների հաջողություններ')}
          </h2>
      
          <div className="px-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={activeProgramIndex}
                role="tabpanel"
                className="relative mx-auto h-[320px] w-full max-w-[320px] overflow-hidden rounded-[22px] bg-[#093394]"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <p className="absolute left-6 top-5 text-[64px] font-bold leading-[64px] text-white">
                  {(activeProgramIndex + 1).toString().padStart(2, '0')}
                </p>
                <p className="absolute left-6 top-[108px] text-[20px] font-bold leading-[26px] text-white">
                  {tr('Program Name', 'Ծրագրի անվանում')}
                </p>
                <p className="absolute left-6 top-[196px] text-[20px] font-bold leading-[30px] text-white">
                  18000 AMD
                  {isHy ? (
                    <span className="text-white/60">
                      <span>/</span>
                      <span className="text-[16px]">ամսական</span>
                    </span>
                  ) : (
                    <span className="text-white/60">/MO</span>
                  )}
                </p>
                <p className="absolute left-6 top-[230px] text-[13px] leading-[19.5px] text-white">
                  {tr('Program details', 'Ծրագրի մանրամասներ')}
                </p>
                <Link
                  href="/login"
                  className={cn(
                    'absolute left-5 top-[256px] inline-flex h-[43px] w-[112px] items-center justify-center gap-1 rounded-full bg-white text-[13px] font-semibold leading-[19.5px] text-[#093394]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  <span>{tr('Register', 'Գրանցվել')}</span>
                  <Image
                    src={REGISTER_ARROW_IMAGE}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4 object-contain"
                  />
                </Link>
              </motion.article>
            </AnimatePresence>
          </div>
      
          <div className="flex flex-col gap-4 px-5">
            <div
              className="flex justify-center gap-1.5"
              role="tablist"
              aria-label={tr('Programs', 'Ծրագրեր')}
            >
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={activeProgramIndex === index}
                  onClick={() => setActiveProgramIndex(index)}
                  className={cn(
                    'inline-flex h-8 min-w-[36px] items-center justify-center rounded-full px-2 text-[12px] font-semibold leading-none transition-colors',
                    activeProgramIndex === index
                      ? 'bg-[#093394] text-white'
                      : 'border border-[#093394] bg-white text-[#093394]',
                  )}
                >
                  {(index + 1).toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={cn(
                'mx-auto inline-flex h-[50px] w-[180.633px] items-center justify-center rounded-full bg-[#e7000b] text-[15px] font-semibold leading-[22.5px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('More', 'Ավելին')}
            </button>
          </div>
        </div>
      
        <div className="mx-auto hidden w-full max-w-[1280px] flex-col items-center gap-[69px] px-6 py-2 tablet:flex">
          <h2 className="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
            {tr('Student Success', 'Ուսանողների հաջողություններ')}
          </h2>
      
          <div className="flex h-[397px] items-center justify-center gap-5">
            {[1, 2, 3, 4].map((item, index) => (
              <motion.article
                key={item}
                className="relative h-[390px] w-[300px] rounded-[26px] bg-[#093394]"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.35 }}
              >
                <p className="absolute left-[30px] top-[28px] text-[70px] font-bold leading-[78px] text-white">
                  {item.toString().padStart(2, '0')}
                </p>
                <p className="absolute left-[30px] top-[143px] text-[23px] font-bold leading-[26px] text-white">
                  {tr('Program Name', 'Ծրագրի անվանում')}
                </p>
                <p className="absolute left-[30px] top-[184px] text-[14px] leading-[22px] text-white">
                  {tr('Program details', 'Ծրագրի մանրամասներ')}
                </p>
                <p className="absolute left-[30px] top-[256px] text-[23px] font-bold leading-[26px] text-white">
                  18000 AMD
                  {isHy ? (
                    <span className="text-white/60">
                      <span className="text-[23px]">/</span>
                      <span className="text-[16px]">ամսական</span>
                    </span>
                  ) : (
                    <span className="text-[23px] text-white/60">/MO</span>
                  )}
                </p>
                <Link
                  href="/login"
                  className={cn(
                    'absolute left-[26px] top-[308px] inline-flex h-[56px] w-[187px] items-center justify-center gap-1 rounded-[999px] bg-white text-[16px] font-semibold leading-[24px] text-[#093394]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  <span>{tr('Register', 'Գրանցվել')}</span>
                  <Image
                    src={REGISTER_ARROW_IMAGE}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 object-contain"
                  />
                </Link>
              </motion.article>
            ))}
          </div>
      
          <button
            type="button"
            className={cn(
              'inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#e7000b] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('More', 'Ավելին')}
          </button>
        </div>
      </section>
    </>
  );
}
