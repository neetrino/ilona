'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, TEAM_CHECK_ICON } from '../landingConstants';
import { LANDING_PREMIUM_CARD_CLASS } from '../landingAnimations';
import { paytoneOne } from '../landingFont';
import { LandingScrollReveal } from './LandingScrollReveal';
import { LandingStaggerArticle, LandingStaggerGroup, LandingStaggerItem } from './LandingStaggerGroup';
import { LandingCvApplicationModal } from './LandingCvApplicationModal';
import type { LandingSectionProps } from '../types';

const TEAM_ROLES = [
  { titleEn: 'English Teacher', titleHy: 'Անգլերենի ուսուցիչ', subtitleEn: 'Full-time position', subtitleHy: 'Լրիվ դրույք' },
  { titleEn: 'IELTS Instructor', titleHy: 'IELTS դասավանդող', subtitleEn: 'Part-time available', subtitleHy: 'Մասնական դրույք հասանելի է' },
  { titleEn: 'Academic Manager', titleHy: 'Ակադեմիական մենեջեր', subtitleEn: 'Full-time position', subtitleHy: 'Լրիվ դրույք' },
] as const;

export function LandingJoinTeamSection({ tr }: LandingSectionProps) {
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const roles = TEAM_ROLES.map((role) => ({
    title: tr(role.titleEn, role.titleHy),
    subtitle: tr(role.subtitleEn, role.subtitleHy),
  }));

  const offerItems = [
    tr('Competitive salary', 'Մրցունակ աշխատավարձ'),
    tr('Professional development', 'Մասնագիտական զարգացում'),
    tr('Friendly team environment', 'Բարեհամբույր թիմային միջավայր'),
    tr('Modern teaching resources', 'Ժամանակակից դասավանդման ռեսուրսներ'),
  ];

  return (
    <section className="pb-10 pt-10 [background-image:linear-gradient(132deg,rgb(28,57,142)_7.92%,rgb(25,60,184)_92.08%)] tablet:pb-[96px] tablet:pt-[96px] tablet:[background-image:linear-gradient(150.846deg,rgb(28,57,142)_0%,rgb(25,60,184)_100%)]">
      <div className="flex flex-col items-center gap-4 px-5 tablet:hidden">
        <LandingScrollReveal className="text-center">
          <h2 className={cn(paytoneOne.className, 'text-[28px] leading-[42px] tracking-[0.35px] text-white')}>
            {tr('Join Our Team', 'Միացիր մեր թիմին')}
          </h2>
          <p className="mt-2 text-[14px] leading-[22px] tracking-[-0.45px] text-[#dbeafe]">
            {tr(
              "Are you a passionate English teacher? We're always looking for talented educators to join the IEC family and make a difference in students' lives.",
              'Եթե սիրով եք դասավանդում անգլերեն, մենք միշտ փնտրում ենք տաղանդավոր մասնագետների՝ IEC թիմին միանալու և ուսանողների կյանքում փոփոխություն բերելու համար։',
            )}
          </p>
        </LandingScrollReveal>

        <LandingStaggerGroup className="flex w-full flex-col gap-3">
          {roles.map((role) => (
            <LandingStaggerArticle
              key={role.title}
              className={cn('rounded-[14px] bg-[rgba(255,255,255,0.1)] px-5 py-4 text-center backdrop-blur-sm', LANDING_PREMIUM_CARD_CLASS)}
            >
              <h3 className="text-[16px] font-medium leading-[24px] tracking-[-0.44px] text-white">{role.title}</h3>
              <p className="mt-1 text-[13px] leading-[19.5px] tracking-[-0.15px] text-[#bedbff]">{role.subtitle}</p>
            </LandingStaggerArticle>
          ))}
        </LandingStaggerGroup>

        <LandingScrollReveal className="w-full rounded-[16px] bg-[rgba(255,255,255,0.1)] px-5 py-5 backdrop-blur-sm" delay={0.08}>
          <h3 className="text-center text-[18px] font-medium leading-[27px] tracking-[0.07px] text-white">
            {tr('What We Offer', 'Ինչ ենք առաջարկում')}
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {offerItems.map((label) => (
              <div key={label} className="flex items-center gap-3">
                <Image src={TEAM_CHECK_ICON} alt="" width={20} height={20} unoptimized />
                <span className="text-[14px] leading-[21px] tracking-[-0.31px] text-white">{label}</span>
              </div>
            ))}
          </div>
        </LandingScrollReveal>

        <LandingScrollReveal delay={0.12}>
          <button
            type="button"
            onClick={() => setIsCvModalOpen(true)}
            className={cn(
              'inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-medium leading-[22.5px] tracking-[-0.31px] text-[#1c398e] shadow-lg',
              BUTTON_HOVER_CLASS,
            )}
          >
            <FileText className="size-5" strokeWidth={2.25} />
            <span>{tr('Send Your CV', 'Ուղարկել CV')}</span>
          </button>
        </LandingScrollReveal>
      </div>

      <div className="mx-auto hidden w-full max-w-[896px] px-6 tablet:block">
        <LandingScrollReveal className="text-center">
          <h2 className={cn(paytoneOne.className, 'text-[48px] leading-[48px] tracking-[0.3516px] text-white')}>
            {tr('Join Our Team', 'Միացիր մեր թիմին')}
          </h2>
          <p className="mx-auto mt-[36px] max-w-[672px] text-[20px] leading-[28px] tracking-[-0.4492px] text-[#dbeafe]">
            {tr(
              "Are you a passionate English teacher? We're always looking for talented educators to join the IEC family and make a difference in students' lives.",
              'Եթե սիրով եք դասավանդում անգլերեն, մենք միշտ փնտրում ենք տաղանդավոր մասնագետների՝ IEC թիմին միանալու և ուսանողների կյանքում փոփոխություն բերելու համար։',
            )}
          </p>
        </LandingScrollReveal>

        <LandingStaggerGroup className="mt-[72px] grid grid-cols-3 gap-6">
          {roles.map((role) => (
            <LandingStaggerArticle
              key={role.title}
              className={cn('h-[104px] rounded-[14px] bg-[rgba(255,255,255,0.1)] px-6 pt-6 text-center backdrop-blur-sm', LANDING_PREMIUM_CARD_CLASS)}
            >
              <h3 className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-white">{role.title}</h3>
              <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#bedbff]">{role.subtitle}</p>
            </LandingStaggerArticle>
          ))}
        </LandingStaggerGroup>

        <LandingScrollReveal className="mt-12 rounded-[16px] bg-[rgba(255,255,255,0.1)] px-8 pb-8 pt-8 backdrop-blur-sm" delay={0.08}>
          <h3 className="text-center text-[24px] font-medium leading-[32px] tracking-[0.0703px] text-white">
            {tr('What We Offer', 'Ինչ ենք առաջարկում')}
          </h3>
          <LandingStaggerGroup className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: offerItems[0] },
              { label: offerItems[1], shiftLeft: true },
              { label: offerItems[2] },
              { label: offerItems[3], shiftLeft: true },
            ].map((item) => (
              <LandingStaggerItem key={item.label} className={cn('flex items-center gap-3', item.shiftLeft ? 'ml-3' : '')}>
                <Image src={TEAM_CHECK_ICON} alt="" width={24} height={24} unoptimized />
                <span className="text-[16px] leading-[24px] tracking-[-0.3125px] text-white">{item.label}</span>
              </LandingStaggerItem>
            ))}
          </LandingStaggerGroup>
        </LandingScrollReveal>

        <LandingScrollReveal className="mt-8 flex justify-center" delay={0.16}>
          <button
            type="button"
            onClick={() => setIsCvModalOpen(true)}
            className={cn(
              'inline-flex h-[56px] w-[192px] items-center justify-center gap-2 rounded-[80px] bg-white text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-[#1c398e] shadow-lg',
              BUTTON_HOVER_CLASS,
            )}
          >
            <FileText className="size-[26px]" strokeWidth={2.25} />
            <span>{tr('Send Your CV', 'Ուղարկել CV')}</span>
          </button>
        </LandingScrollReveal>
      </div>

      <LandingCvApplicationModal
        open={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
        tr={tr}
      />
    </section>
  );
}
