import type { SVGProps } from 'react';
import { Facebook, Instagram, Send } from 'lucide-react';
import type { FooterIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';

type IconProps = SVGProps<SVGSVGElement>;

function StrokeIcon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function InstagramBrandIcon({ className, ...props }: IconProps) {
  return <Instagram aria-hidden className={cn('size-5 shrink-0', className)} strokeWidth={2} {...props} />;
}

export function FacebookBrandIcon({ className, ...props }: IconProps) {
  return <Facebook aria-hidden className={cn('size-5 shrink-0', className)} strokeWidth={2} {...props} />;
}

export function TelegramBrandIcon({ className, ...props }: IconProps) {
  return <Send aria-hidden className={cn('size-5 shrink-0', className)} strokeWidth={2} {...props} />;
}

export function WhatsAppBrandIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M7.9 20.3 4 21l1-3.7A8.5 8.5 0 1 1 12 20.5a8.4 8.4 0 0 1-4.1-1.2z" />
      <path d="M9.2 9.6c.1 1.8 2.2 3.9 4 4.1.3 0 .6-.2.8-.5l.6-.9a.6.6 0 0 0 0-.6l-1-.7a.6.6 0 0 0-.6 0l-.4.3c-.2.2-.5.1-.7 0-1-.6-1.6-1.3-2-2.2-.1-.2-.1-.5 0-.7l.3-.4a.6.6 0 0 0 0-.6l-.7-1a.6.6 0 0 0-.6 0l-.9.6c-.3.2-.5.5-.4.8z" />
    </StrokeIcon>
  );
}

export function ViberBrandIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M7.5 3.5h9A3.5 3.5 0 0 1 20 7v7.5a3.5 3.5 0 0 1-3.5 3.5H13L9 21.5v-3.5H7.5A3.5 3.5 0 0 1 4 14.5V7a3.5 3.5 0 0 1 3.5-3.5z" />
      <path d="M9.4 10.2c2.2-2.2 5.7-2.2 7.9 0" />
      <path d="M10.7 11.6c1.4-1.4 3.7-1.4 5.1 0" />
      <path d="M13.2 14.2h.01" />
    </StrokeIcon>
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
        'inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm',
        size === 'sm' ? 'size-10' : 'size-16',
      )}
    >
      <Icon className={cn(FOLLOW_ICON_CLASS[network], size === 'sm' ? 'size-5' : 'size-8')} />
    </span>
  );
}
