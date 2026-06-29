import { useLocale } from 'next-intl';
import type { LandingTr } from '../types';

export function useLandingTr(): { tr: LandingTr; isHy: boolean; locale: string } {
  const locale = useLocale();
  const isHy = locale === 'hy';
  const tr: LandingTr = (en, hy) => (isHy ? hy : en);
  return { tr, isHy, locale };
}
