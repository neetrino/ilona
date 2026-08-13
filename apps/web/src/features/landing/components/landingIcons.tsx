import type { FooterIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';

const SOCIAL_ICON_SRC: Record<FooterIconKey, string> = {
  instagram: '/landing/icons/instagram.svg',
  facebook: '/landing/icons/facebook.svg',
  telegram: '/landing/icons/telegram.svg',
  whatsapp: '/landing/icons/whatsapp.svg',
  viber: '/landing/icons/viber.svg',
};

function OfficialBrandMark({
  name,
  className,
  colorClassName,
}: {
  name: FooterIconKey;
  className?: string;
  colorClassName: string;
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', colorClassName, className)}
      style={{
        maskImage: `url(${SOCIAL_ICON_SRC[name]})`,
        WebkitMaskImage: `url(${SOCIAL_ICON_SRC[name]})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

export function FooterSocialGlyph({ name, className }: { name: FooterIconKey; className?: string }) {
  return <OfficialBrandMark name={name} className={className} colorClassName="bg-[#111827]" />;
}

export function FollowBrandMark({
  network,
  size,
}: {
  network: 'instagram' | 'facebook' | 'telegram';
  size: 'sm' | 'lg';
}) {
  const markSize = size === 'sm' ? 'size-10' : 'size-16';
  const colorClassName =
    network === 'instagram' ? 'bg-[#e60076]' : network === 'facebook' ? 'bg-[#1877F2]' : 'bg-[#27A7E7]';

  return (
    <OfficialBrandMark name={network} className={cn('shrink-0', markSize)} colorClassName={colorClassName} />
  );
}
