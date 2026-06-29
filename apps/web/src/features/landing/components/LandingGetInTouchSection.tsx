'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, GET_TOUCH_PHONE_ICON, GET_TOUCH_EMAIL_ICON } from '../landingConstants';
import type { LandingSectionProps } from '../types';

export function LandingGetInTouchSection({ tr }: LandingSectionProps) {

  return (
    <>
      <section id="contact" className="scroll-mt-28 bg-white">
        <div className="flex flex-col items-center gap-6 px-5 pb-10 pt-10 tablet:hidden">
          <div className="text-center">
            <h2 className="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#1b3ba4]">
              {tr('Get in Touch', 'Կապ մեզ հետ')}
            </h2>
            <p className="mt-2 text-[18px] leading-[27px] tracking-[0.07px] text-[rgba(27,59,163,0.4)]">
              {tr("We're here to help!", 'Մենք այստեղ ենք՝ օգնելու համար։')}
            </p>
          </div>
      
          <div className="flex w-full flex-col gap-3">
            <Link
              href="tel:+1234567890"
              className={cn(
                'inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-full bg-[#1b3ba4] text-[16px] font-bold leading-[24px] tracking-[-0.44px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              <Image src={GET_TOUCH_PHONE_ICON} alt="" width={20} height={20} unoptimized />
              <span>+1 (234) 567-890</span>
            </Link>
            <Link
              href="mailto:info@iec.com"
              className={cn(
                'inline-flex h-[58px] w-full items-center justify-center gap-3 rounded-full border border-[rgba(27,59,164,0.6)] bg-[rgba(255,255,255,0.1)] text-[16px] font-bold leading-[24px] tracking-[-0.44px] text-[#1b3ba4]',
                BUTTON_HOVER_CLASS,
              )}
            >
              <Image src={GET_TOUCH_EMAIL_ICON} alt="" width={20} height={20} unoptimized />
              <span>info@iec.com</span>
            </Link>
          </div>
        </div>
      
        <div
          className="hidden py-20 tablet:block"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgb(255, 255, 255) 0.52083%, rgba(0, 0, 0, 0) 0.52083%), linear-gradient(90deg, rgb(255, 255, 255) 0.13605%, rgba(0, 0, 0, 0) 0.13605%)',
          }}
        >
          <div className="mx-auto w-full max-w-[896px] px-6 text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#1b3ba4]">
              {tr('Get in Touch', 'Կապ մեզ հետ')}
            </h2>
            <p className="mt-6 text-[24px] leading-[32px] tracking-[0.0703px] text-[rgba(27,59,163,0.4)]">
              {tr("We're here to help!", 'Մենք այստեղ ենք՝ օգնելու համար։')}
            </p>
      
            <div className="mt-12 flex items-center justify-center gap-6">
              <Link
                href="tel:+1234567890"
                className={cn(
                  'inline-flex h-[56px] w-[271px] items-center justify-center gap-3 rounded-full bg-[#1b3ba4] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-white',
                  BUTTON_HOVER_CLASS,
                )}
              >
                <Image src={GET_TOUCH_PHONE_ICON} alt="" width={24} height={24} unoptimized />
                <span>+1 (234) 567-890</span>
              </Link>
              <Link
                href="mailto:info@iec.com"
                className={cn(
                  'inline-flex h-[56px] w-[237px] items-center justify-center gap-3 rounded-full border-2 border-[rgba(27,59,164,0.6)] bg-[rgba(255,255,255,0.1)] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-[#1b3ba4]',
                  BUTTON_HOVER_CLASS,
                )}
              >
                <Image src={GET_TOUCH_EMAIL_ICON} alt="" width={24} height={24} unoptimized />
                <span>info@iec.com</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
