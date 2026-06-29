'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, FAQ_DROPDOWN_ICON, FAQ_ITEMS_EN, FAQ_ITEMS_HY } from '../landingConstants';
import type { LandingSectionProps } from '../types';

export function LandingFaqSection({ tr, isHy }: LandingSectionProps) {
  const faqItems = isHy ? FAQ_ITEMS_HY : FAQ_ITEMS_EN;

  return (
    <>
      <section id="faq" className="scroll-mt-28 bg-[#ecf0f7]">
        <div className="flex flex-col items-center gap-6 px-5 pb-10 pt-10 tablet:hidden">
          <div className="text-center">
            <h2 className="text-[26px] font-extrabold leading-[39px] tracking-[0.35px] text-[#101828]">
              {tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
            </h2>
            <p className="mt-2 text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]">
              {tr('Everything you need to know', 'Ամեն ինչ, ինչ պետք է իմանալ')}
            </p>
          </div>
      
          <div className="flex w-full flex-col gap-3">
            {faqItems.map((question) => (
              <button
                key={question}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-white bg-white px-5 py-5 text-left"
              >
                <span className="text-[15px] font-medium leading-[26px] tracking-[-0.44px] text-[#101828]">
                  {question}
                </span>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bedbff] drop-shadow-[0px_1px_2px_rgba(0,0,0,0.15)]">
                  <Image
                    src={FAQ_DROPDOWN_ICON}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="translate-y-[1px]"
                  />
                </span>
              </button>
            ))}
          </div>
      
          <div className="text-center">
            <p className="text-[15px] leading-[22.5px] tracking-[-0.44px] text-[#364153]">
              {tr('Still have questions?', 'Դեռ հարցե՞ր ունեք')}
            </p>
            <Link
              href="#contact"
              className={cn(
                'mt-3 inline-flex h-[49px] items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-8 text-[14px] font-normal leading-[21px] tracking-[-0.31px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('Contact Us', 'Կապ մեզ հետ')}
            </Link>
          </div>
        </div>
      
        <div className="hidden pb-[96px] pt-[96px] tablet:block">
          <div className="mx-auto flex w-full max-w-[896px] flex-col items-center px-6">
            <div className="text-center">
              <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#101828]">
                {tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
              </h2>
              <p className="mt-2 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
                {tr('Everything you need to know', 'Ամեն ինչ, ինչ պետք է իմանալ')}
              </p>
            </div>
      
            <div className="mt-16 flex w-full flex-col gap-4">
              {faqItems.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="flex h-[84px] w-full items-center justify-between rounded-[24px] border-2 border-white bg-white px-6 text-left"
                >
                  <span className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-[#101828]">
                    {question}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bedbff] shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.1)]">
                    <Image
                      src={FAQ_DROPDOWN_ICON}
                      alt=""
                      width={20}
                      height={20}
                      unoptimized
                      className="translate-y-[2px]"
                    />
                  </span>
                </button>
              ))}
            </div>
      
            <div className="mt-[52px] text-center">
              <p className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#364153]">
                {tr('Still have questions?', 'Դեռ հարցե՞ր ունեք')}
              </p>
              <Link
                href="#contact"
                className={cn(
                  'mt-[14px] inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-[30px] text-[16px] font-normal leading-6 tracking-[-0.3125px] text-white',
                  BUTTON_HOVER_CLASS,
                )}
              >
                {tr('Contact Us', 'Կապ մեզ հետ')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
