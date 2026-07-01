'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS } from '../landingConstants';
import { createLandingFaqItems } from '../landingFaqContent';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingScrollReveal } from './LandingScrollReveal';
import { LandingStaggerGroup, LandingStaggerItem } from './LandingStaggerGroup';
import { LandingFaqAccordionItem } from './LandingFaqAccordionItem';
import type { LandingSectionProps } from '../types';

export function LandingFaqSection({ tr }: LandingSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const faqItems = useMemo(() => createLandingFaqItems(tr), [tr]);

  const handleToggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <section id="faq" className="scroll-mt-28 bg-[#ecf0f7]">
      <div className="flex flex-col items-center gap-6 px-5 pb-10 pt-10 tablet:hidden">
        <LandingSectionHeader
          title={tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
          subtitle={tr('Everything you need to know', 'Ամեն ինչ, ինչ պետք է իմանալ')}
          titleClassName="text-[26px] font-extrabold leading-[39px] tracking-[0.35px] text-[#101828]"
          subtitleClassName="text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]"
        />

        <LandingStaggerGroup className="flex w-full flex-col gap-3">
          {faqItems.map((item) => (
            <LandingStaggerItem key={item.id}>
              <LandingFaqAccordionItem
                id={item.id}
                question={item.question}
                answer={item.answer}
                isOpen={openId === item.id}
                onToggle={() => handleToggle(item.id)}
              />
            </LandingStaggerItem>
          ))}
        </LandingStaggerGroup>

        <LandingScrollReveal className="text-center" delay={0.12}>
          <p className="text-[15px] leading-[22.5px] tracking-[-0.44px] text-[#364153]">
            {tr('Still have questions?', 'Դեռ հարցե՞ր ունեք')}
          </p>
          <Link
            href="#contact"
            className={cn(
              'mt-3 inline-flex h-[49px] items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-8 text-[14px] font-normal leading-[21px] tracking-[-0.31px] text-white shadow-md',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('Contact Us', 'Կապ մեզ հետ')}
          </Link>
        </LandingScrollReveal>
      </div>

      <div className="hidden pb-[96px] pt-[96px] tablet:block">
        <div className="mx-auto flex w-full max-w-[896px] flex-col items-center px-6">
          <LandingSectionHeader
            title={tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
            subtitle={tr('Everything you need to know', 'Ամեն ինչ, ինչ պետք է իմանալ')}
            titleClassName="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#101828]"
            subtitleClassName="text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]"
          />

          <LandingStaggerGroup className="mt-16 flex w-full flex-col gap-4">
            {faqItems.map((item) => (
              <LandingStaggerItem key={item.id}>
                <LandingFaqAccordionItem
                  id={item.id}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openId === item.id}
                  onToggle={() => handleToggle(item.id)}
                />
              </LandingStaggerItem>
            ))}
          </LandingStaggerGroup>

          <LandingScrollReveal className="mt-[52px] text-center" delay={0.16}>
            <p className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#364153]">
              {tr('Still have questions?', 'Դեռ հարցե՞ր ունեք')}
            </p>
            <Link
              href="#contact"
              className={cn(
                'mt-[14px] inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-[30px] text-[16px] font-normal leading-6 tracking-[-0.3125px] text-white shadow-md',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('Contact Us', 'Կապ մեզ հետ')}
            </Link>
          </LandingScrollReveal>
        </div>
      </div>
    </section>
  );
}
