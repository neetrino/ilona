'use client';

import Image from 'next/image';
import { LANDING_ASSETS } from '@/features/landing/landingAssets';
import { useFooterIconLinks } from '@/features/settings/hooks/useFooterIconLinks';
import { useInView } from '@/shared/hooks/useInView';
import type { FooterIconKey } from '@ilona/types';

const iconShellClassName =
  'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2f5fb]';

const clickableIconClassName = `${iconShellClassName} cursor-pointer transition-transform duration-200 ease-out hover:scale-110 hover:brightness-95 active:scale-95`;

const staticIconClassName = `${iconShellClassName} cursor-default`;

const FOOTER_ICON_CONFIG: Array<{
  key: FooterIconKey;
  src: string;
  viberSize?: boolean;
}> = [
  { key: 'instagram', src: LANDING_ASSETS.footerSocialInstagram },
  { key: 'facebook', src: LANDING_ASSETS.footerSocialFacebook },
  { key: 'telegram', src: LANDING_ASSETS.footerSocialTelegram },
  { key: 'whatsapp', src: LANDING_ASSETS.footerSocialWhatsapp },
  { key: 'viber', src: LANDING_ASSETS.footerSocialViber, viberSize: true },
];

interface FooterSocialIconsProps {
  containerClassName?: string;
  getAriaLabel: (key: FooterIconKey) => string;
}

function isExternalLink(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

export function FooterSocialIcons({ containerClassName, getAriaLabel }: FooterSocialIconsProps) {
  const { ref, inView } = useInView({ rootMargin: '300px', triggerOnce: true });
  const { data: links, isLoading } = useFooterIconLinks({ enabled: inView });

  return (
    <div ref={ref} className={containerClassName} aria-busy={isLoading || undefined}>
      {FOOTER_ICON_CONFIG.map(({ key, src, viberSize }) => {
        const href = links?.[key]?.trim() ?? '';
        const iconClassName = viberSize ? 'size-5' : 'size-10';
        const imageSize = viberSize ? 20 : 40;

        const iconContent = (
          <Image
            src={src}
            alt=""
            width={imageSize}
            height={imageSize}
            unoptimized
            className={iconClassName}
          />
        );

        if (!href) {
          return (
            <span
              key={key}
              className={staticIconClassName}
              aria-label={getAriaLabel(key)}
            >
              {iconContent}
            </span>
          );
        }

        const external = isExternalLink(href);

        return (
          <a
            key={key}
            href={href}
            className={clickableIconClassName}
            aria-label={getAriaLabel(key)}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {iconContent}
          </a>
        );
      })}
    </div>
  );
}
