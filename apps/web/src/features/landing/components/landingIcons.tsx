import type { SVGProps } from 'react';
import type { FooterIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';

type IconProps = SVGProps<SVGSVGElement>;

function BrandIcon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function InstagramBrandIcon(props: IconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
    </BrandIcon>
  );
}

export function FacebookBrandIcon(props: IconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1" />
    </BrandIcon>
  );
}

export function TelegramBrandIcon(props: IconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M21.5 3.2 2.7 10.4c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.9 5.8c.2.7.4 1 1 .1l2.7-2.5 5.6 4.1c1 .6 1.8.3 2.1-.9l3.8-17.8c.4-1.6-.6-2.3-1.9-1.8M17.7 7.4l-8.9 8.1-.3 3.5-1.5-5.2z" />
    </BrandIcon>
  );
}

export function WhatsAppBrandIcon(props: IconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-.97-.3-.1-.5-.15-.7.15s-.8.97-.9 1.16c-.2.2-.3.22-.6.07-.3-.15-1.3-.46-2.4-1.47-.9-.79-1.5-1.76-1.7-2.06-.17-.3 0-.46.13-.6.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37 0-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37A9.86 9.86 0 0 1 2.16 11.9C2.16 6.45 6.6 2.02 12.05 2.02A9.83 9.83 0 0 1 19.04 4.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.43 9.88-9.85 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.94L0 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41" />
    </BrandIcon>
  );
}

export function ViberBrandIcon(props: IconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M11.4 0C17.7.2 22.5 4.8 22.8 10.8c.2 4.2-1.4 8.2-4.6 10.6-1.4 1-3 1.7-4.7 2l-.2 1.5c0 .5-.3 1-.8 1.2-.2.1-.4.1-.6.1-.3 0-.6-.1-.8-.2l-4.3-2C4.2 23.2 2 21.4.9 18.7-.6 15.2.2 11.2 2.6 8.4 5.1 5.4 8.3.9 11.4 0m.7 2.2c-2.4.1-5.4 3.9-7.3 6.2-1.8 2.2-2.4 5.3-1.2 7.9.8 1.9 2.4 3.3 4.4 3.9l3.1 1.4.1-1.1c0-.5.3-1 .8-1.1 1.4-.3 2.7-.9 3.8-1.7 2.4-1.8 3.6-4.8 3.5-8-.3-4.5-3.7-7.6-7.2-7.5m.1 3.1c.4 0 .7.3.8.7l.3 1.6c.1.4-.2.8-.6.9-.4.1-.8-.2-.9-.6l-.3-1.6c-.1-.4.2-.9.7-1m3.2 1.1c.3-.2.8-.1 1 .3 1 1.8.9 3.9-.1 5.6-.2.4-.7.5-1 .3s-.5-.7-.3-1.1c.8-1.3.8-2.9.1-4.2-.2-.4 0-.8.3-1m-6.5.6c.4-.1.8.2.9.6l.5 2.2c.1.4-.2.8-.6.9s-.8-.2-.9-.6l-.5-2.2c-.1-.4.2-.8.6-.9m3.3.9c.4-.1.8.2.9.6l.4 1.7c.1.4-.2.8-.6.9-.4.1-.8-.2-.9-.6l-.4-1.7c-.1-.4.2-.8.6-.9" />
    </BrandIcon>
  );
}

const FOOTER_SOCIAL_ICONS = {
  instagram: InstagramBrandIcon,
  facebook: FacebookBrandIcon,
  telegram: TelegramBrandIcon,
  whatsapp: WhatsAppBrandIcon,
  viber: ViberBrandIcon,
} satisfies Record<FooterIconKey, (props: IconProps) => JSX.Element>;

export function FooterSocialGlyph({ name, className }: { name: FooterIconKey; className?: string }) {
  const Icon = FOOTER_SOCIAL_ICONS[name];
  return <Icon className={className} />;
}

const FOLLOW_ICON_CLASS: Record<'instagram' | 'facebook' | 'telegram', string> = {
  instagram: 'text-[#e60076]',
  facebook: 'text-[#155dfc]',
  telegram: 'text-[#27abe4]',
};

const FOLLOW_ICON = {
  instagram: InstagramBrandIcon,
  facebook: FacebookBrandIcon,
  telegram: TelegramBrandIcon,
} as const;

export function FollowBrandMark({
  network,
  size,
}: {
  network: 'instagram' | 'facebook' | 'telegram';
  size: 'sm' | 'lg';
}) {
  const Icon = FOLLOW_ICON[network];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-white text-current shadow-sm',
        size === 'sm' ? 'size-10' : 'size-16',
      )}
    >
      <Icon className={cn(FOLLOW_ICON_CLASS[network], size === 'sm' ? 'size-5' : 'size-8')} />
    </span>
  );
}
