'use client';

import { useCallback, useMemo, useState } from 'react';
import { createLandingFaqItems } from '../landingFaqContent';
import { LandingSectionHeader } from './LandingSectionHeader';
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
          subtitle={tr('Everything you need to know', 'Այն ամենը, ինչ անհրաժեշտ է իմանալ')}
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
      </div>

      <div className="hidden pb-[96px] pt-[96px] tablet:block">
        <div className="mx-auto flex w-full max-w-[896px] flex-col items-center px-6">
          <LandingSectionHeader
            title={tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
            subtitle={tr('Everything you need to know', 'Այն ամենը, ինչ անհրաժեշտ է իմանալ')}
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
        </div>
      </div>
    </section>
  );
}
