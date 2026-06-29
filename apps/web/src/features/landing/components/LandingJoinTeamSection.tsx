'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, TEAM_CHECK_ICON, TEAM_SEND_CV_ICON } from '../landingConstants';
import { paytoneOne } from '../landingFont';
import type { LandingSectionProps } from '../types';

export function LandingJoinTeamSection({ tr }: LandingSectionProps) {

  return (
    <>
      <section
        className="pb-10 pt-10 [background-image:linear-gradient(132deg,rgb(28,57,142)_7.92%,rgb(25,60,184)_92.08%)] tablet:pb-[96px] tablet:pt-[96px] tablet:[background-image:linear-gradient(150.846deg,rgb(28,57,142)_0%,rgb(25,60,184)_100%)]"
      >
        <div className="flex flex-col items-center gap-4 px-5 tablet:hidden">
          <h2
            className={cn(
              paytoneOne.className,
              'text-center text-[28px] leading-[42px] tracking-[0.35px] text-white',
            )}
          >
            {tr('Join Our Team', 'Միացիր մեր թիմին')}
          </h2>
          <p className="text-center text-[14px] leading-[22px] tracking-[-0.45px] text-[#dbeafe]">
            {tr(
              "Are you a passionate English teacher? We're always looking for talented educators to join the IEC family and make a difference in students' lives.",
              'Եթե սիրով եք դասավանդում անգլերեն, մենք միշտ փնտրում ենք տաղանդավոր մասնագետների՝ IEC թիմին միանալու և ուսանողների կյանքում փոփոխություն բերելու համար։',
            )}
          </p>
      
          <div className="flex w-full flex-col gap-3">
            {[
              {
                title: tr('English Teacher', 'Անգլերենի ուսուցիչ'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
              {
                title: tr('IELTS Instructor', 'IELTS դասավանդող'),
                subtitle: tr('Part-time available', 'Մասնական դրույք հասանելի է'),
              },
              {
                title: tr('Academic Manager', 'Ակադեմիական մենեջեր'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
            ].map((role) => (
              <article
                key={role.title}
                className="rounded-[14px] bg-[rgba(255,255,255,0.1)] px-5 py-4 text-center"
              >
                <h3 className="text-[16px] font-medium leading-[24px] tracking-[-0.44px] text-white">
                  {role.title}
                </h3>
                <p className="mt-1 text-[13px] leading-[19.5px] tracking-[-0.15px] text-[#bedbff]">
                  {role.subtitle}
                </p>
              </article>
            ))}
          </div>
      
          <div className="w-full rounded-[16px] bg-[rgba(255,255,255,0.1)] px-5 py-5">
            <h3 className="text-center text-[18px] font-medium leading-[27px] tracking-[0.07px] text-white">
              {tr('What We Offer', 'Ինչ ենք առաջարկում')}
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {[
                tr('Competitive salary', 'Մրցունակ աշխատավարձ'),
                tr('Professional development', 'Մասնագիտական զարգացում'),
                tr('Friendly team environment', 'Բարեհամբույր թիմային միջավայր'),
                tr('Modern teaching resources', 'Ժամանակակից դասավանդման ռեսուրսներ'),
              ].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <Image src={TEAM_CHECK_ICON} alt="" width={20} height={20} unoptimized />
                  <span className="text-[14px] leading-[21px] tracking-[-0.31px] text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
      
          <Link
            href="#contact"
            className={cn(
              'inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-medium leading-[22.5px] tracking-[-0.31px] text-[#1c398e]',
              BUTTON_HOVER_CLASS,
            )}
          >
            <Image src={TEAM_SEND_CV_ICON} alt="" width={20} height={20} unoptimized />
            <span>{tr('Send Your CV', 'Ուղարկել CV')}</span>
          </Link>
        </div>
      
        <div className="mx-auto hidden w-full max-w-[896px] px-6 tablet:block">
          <h2
            className={cn(
              paytoneOne.className,
              'text-center text-[48px] leading-[48px] tracking-[0.3516px] text-white',
            )}
          >
            {tr('Join Our Team', 'Միացիր մեր թիմին')}
          </h2>
          <p className="mx-auto mt-[36px] max-w-[672px] text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#dbeafe]">
            {tr(
              "Are you a passionate English teacher? We're always looking for talented educators to join the IEC family and make a difference in students' lives.",
              'Եթե սիրով եք դասավանդում անգլերեն, մենք միշտ փնտրում ենք տաղանդավոր մասնագետների՝ IEC թիմին միանալու և ուսանողների կյանքում փոփոխություն բերելու համար։',
            )}
          </p>
      
          <div className="mt-[72px] grid grid-cols-3 gap-6">
            {[
              {
                title: tr('English Teacher', 'Անգլերենի ուսուցիչ'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
              {
                title: tr('IELTS Instructor', 'IELTS դասավանդող'),
                subtitle: tr('Part-time available', 'Մասնական դրույք հասանելի է'),
              },
              {
                title: tr('Academic Manager', 'Ակադեմիական մենեջեր'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
            ].map((role) => (
              <article
                key={role.title}
                className="h-[104px] rounded-[14px] bg-[rgba(255,255,255,0.1)] px-6 pt-6 text-center"
              >
                <h3 className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-white">
                  {role.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#bedbff]">
                  {role.subtitle}
                </p>
              </article>
            ))}
          </div>
      
          <div className="mt-12 rounded-[16px] bg-[rgba(255,255,255,0.1)] px-8 pb-8 pt-8">
            <h3 className="text-center text-[24px] font-medium leading-[32px] tracking-[0.0703px] text-white">
              {tr('What We Offer', 'Ինչ ենք առաջարկում')}
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: tr('Competitive salary', 'Մրցունակ աշխատավարձ') },
                { label: tr('Professional development', 'Մասնագիտական զարգացում'), shiftLeft: true },
                { label: tr('Friendly team environment', 'Բարեհամբույր թիմային միջավայր') },
                { label: tr('Modern teaching resources', 'Ժամանակակից դասավանդման ռեսուրսներ'), shiftLeft: true },
              ].map((item) => (
                <div key={item.label} className={cn('flex items-center gap-3', item.shiftLeft ? 'ml-3' : '')}>
                  <Image src={TEAM_CHECK_ICON} alt="" width={24} height={24} unoptimized />
                  <span className="text-[16px] leading-[24px] tracking-[-0.3125px] text-white">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
      
          <Link
            href="#contact"
            className="mx-auto mt-8 flex h-[56px] w-[192px] items-center justify-center gap-2 rounded-[80px] bg-white text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-[#1c398e]"
          >
            <Image src={TEAM_SEND_CV_ICON} alt="" width={26} height={26} unoptimized />
            <span>{tr('Send Your CV', 'Ուղարկել CV')}</span>
          </Link>
        </div>
      </section>
    </>
  );
}
