'use client';

import { FooterSocialGlyph } from './landingIcons';
import { useFooterIconLinks } from '@/features/settings/hooks/useFooterIconLinks';
import { useInView } from '@/shared/hooks/useInView';
import type { FooterIconKey } from '@ilona/types';

const iconShellClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f5fb] text-[#111827]';

const clickableIconClassName = `${iconShellClassName} cursor-pointer transition-transform duration-200 ease-out hover:scale-105 active:scale-95`;

const staticIconClassName = `${iconShellClassName} cursor-default`;

const FOOTER_ICON_KEYS: FooterIconKey[] = [
  'instagram',
  'facebook',
  'telegram',
  'whatsapp',
  'viber',
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
      {FOOTER_ICON_KEYS.map((key) => {
        const href = links?.[key]?.trim() ?? '';
        const iconContent = <FooterSocialGlyph name={key} className="size-7" />;

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
