'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { FOOTER_LOGO_IMAGE, FOOTER_FLAG_USA, FOOTER_FLAG_UK } from '../landingConstants';
import { FooterSocialIcons } from './FooterSocialIcons';
import type { FooterIconKey } from '@ilona/types';
import type { LandingFooterProps } from '../types';

export function LandingFooter({ tr, isHy, logoUrl }: LandingFooterProps) {

  return (
    <>
      <footer className="relative overflow-hidden bg-black text-white">
        <div className="relative z-10 flex flex-col gap-6 px-5 pb-8 pt-8 tablet:hidden">
          <div className="flex items-center gap-3">
            <div className="relative size-[46px] shrink-0 overflow-hidden rounded-full">
              <Image
                src={logoUrl}
                alt="Ilona English Centre"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <span className="text-[16px] font-bold leading-[24px] text-white">
              Ilona English Centre
            </span>
          </div>
      
          <FooterSocialIcons
            containerClassName="flex items-center gap-3"
            getAriaLabel={(key: FooterIconKey) => {
              if (key === 'viber') return tr('Viber', 'Viber');
              if (key === 'instagram') return tr('Instagram', 'Instagram');
              if (key === 'facebook') return tr('Facebook', 'Facebook');
              if (key === 'telegram') return tr('Telegram', 'Telegram');
              if (key === 'whatsapp') return tr('WhatsApp', 'WhatsApp');
              return tr('Social link', 'Սոցիալական հղում');
            }}
          />
      
          <div className="grid grid-cols-2 gap-x-6 border-t border-white/20 pt-6">
            <div>
              <h3 className="text-[15px] font-bold leading-[22.5px] text-white">
                {tr('Navigation', 'Նավիգացիա')}
              </h3>
              <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-[20px] text-white/80">
                <li>
                  <Link href="#about" className="hover:text-white">
                    {tr('About Us', 'Մեր մասին')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    {tr('Careers', 'Աշխատանք')}
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white">
                    {tr('FAQs', 'ՀՏՀ')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    {tr('Teams', 'Թիմ')}
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-white">
                    {tr('Contact Us', 'Կապ մեզ հետ')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-bold leading-[22.5px] text-white">
                {tr('Branches', 'Մասնաճյուղեր')}
              </h3>
              <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-[20px] text-white/80">
                <li>{tr('Andranik 131/8', 'Անդրանիկի 131/8')}</li>
                <li>{tr('Andranik 40', 'Անդրանիկի 40')}</li>
                <li>{tr('Ervand Qochar 23/2', 'Երվանդ Քոչարի 23/2')}</li>
                <li>{tr('Hanrapetutyan 67/3', 'Հանրապետության 67/3')}</li>
              </ul>
            </div>
          </div>
      
          <div className="border-t border-white/20 pt-4">
            <p className="text-[14px] font-bold leading-[21px] text-white">{tr('Call us', 'Զանգեք մեզ')}</p>
            <a href="tel:+18008543680" className="mt-1 block text-[14px] leading-[21px] text-white/80 hover:text-white">
              +1 800 854-36-80
            </a>
          </div>
      
          <div className="flex flex-col gap-2 border-t border-white/20 pt-4">
            <div className="flex gap-6 text-[12px] leading-[18px] text-white/70">
              <Link href="#" className="hover:text-white">
                {tr('Privacy Policy', 'Գաղտնիության քաղաքականություն')}
              </Link>
              <Link href="#" className="hover:text-white">
                {tr('Terms of Use', 'Օգտագործման պայմաններ')}
              </Link>
            </div>
            <p className="text-[12px] leading-[21px] text-white/70">
              Copyright &copy;2026{' '}
              <Link
                href="https://neetrino.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white/70 no-underline hover:text-white hover:no-underline"
              >
                Neetrino IT Company
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      
        <div className="relative hidden overflow-hidden px-3 pb-[31px] pt-[67px] sm:px-6 tablet:block">
        <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full w-[1470px]">
          <div className="footer-flags-stage absolute left-1/2 top-[48px] h-[400px] w-[502px]">
            <div className="footer-flag footer-flag--usa absolute left-0 top-0 h-[400px] w-[400px] overflow-hidden">
              <Image
                src={FOOTER_FLAG_USA}
                alt=""
                fill
                loading="lazy"
                sizes="400px"
                className="object-cover"
              />
            </div>
      
            <div className="footer-flag footer-flag--uk absolute left-[102px] top-0 h-[400px] w-[400px] overflow-hidden">
              <Image
                src={FOOTER_FLAG_UK}
                alt=""
                fill
                loading="lazy"
                sizes="400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      
        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-start justify-between">
          <div className="w-[465px]">
            <div className="flex items-center gap-4">
              <Image
                src={FOOTER_LOGO_IMAGE}
                alt="Ilona English Centre"
                width={52}
                height={52}
                unoptimized
                className="rounded-full"
              />
              <span className="text-[26px] font-bold leading-[18px] tracking-[-0.18px]">
                Ilona English Centre
              </span>
            </div>
      
            <FooterSocialIcons
              containerClassName="mt-[52px] flex items-center gap-6"
              getAriaLabel={(key: FooterIconKey) => {
                if (key === 'viber') return tr('Viber', 'Viber');
                if (key === 'instagram') return tr('Instagram', 'Instagram');
                if (key === 'facebook') return tr('Facebook', 'Facebook');
                if (key === 'telegram') return tr('Telegram', 'Telegram');
                if (key === 'whatsapp') return tr('WhatsApp', 'WhatsApp');
                return tr('Social link', 'Սոցիալական հղում');
              }}
            />
      
            <div className="mt-[18px] h-px w-[296px] bg-white/60" />
      
            <div
              className={cn(
                'mt-6 text-[14px] leading-[21px]',
                isHy ? 'flex flex-col items-start gap-1' : 'flex items-center gap-4',
              )}
            >
              <Link href="#" className="hover:text-white/80">
                {tr('Privacy Policy', 'Գաղտնիության քաղաքականություն')}
              </Link>
              <Link href="#" className="hover:text-white/80">
                {tr('Terms of Use', 'Օգտագործման պայմաններ')}
              </Link>
            </div>
      
            <p className="mt-4 text-[14px] leading-[21px] text-white">
              Copyright &copy;2026{' '}
              <Link
                href="https://neetrino.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold no-underline hover:no-underline"
              >
                Neetrino IT Company
              </Link>
              . All Rights Reserved.
            </p>
          </div>
      
          <div className="ml-auto grid w-full max-w-[560px] grid-cols-2 items-start pt-[2px] sm:translate-x-20">
            <div className="w-[203px] sm:translate-x-[100px]">
              <h3 className="text-[18px] font-bold leading-[normal]">{tr('Branches', 'Մասնաճյուղեր')}</h3>
              <ul className="mt-[29px] space-y-2 text-[15px] leading-[23px]">
                <li>{tr('Andranik 131/8', 'Անդրանիկի 131/8')}</li>
                <li>{tr('Andranik 40', 'Անդրանիկի 40')}</li>
                <li className="whitespace-nowrap">{tr('Ervand Qochar 23/2', 'Երվանդ Քոչարի 23/2')}</li>
                <li className="whitespace-nowrap">{tr('Hanrapetutyan 67/3', 'Հանրապետության 67/3')}</li>
              </ul>
            </div>
      
            <div className="w-[203px] justify-self-end">
              <h3 className="text-[18px] font-bold leading-[normal]">{tr('Navigation', 'Նավիգացիա')}</h3>
              <ul className="mt-[29px] space-y-2 text-[14px] leading-[normal]">
                <li>
                  <Link href="#about" className="hover:text-white/80">
                    {tr('About Us', 'Մեր մասին')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    {tr('Careers', 'Աշխատանք')}
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white/80">
                    {tr('FAQs', 'ՀՏՀ')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    {tr('Teams', 'Թիմ')}
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-white/80">
                    {tr('Contact Us', 'Կապ մեզ հետ')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </footer>
    </>
  );
}
