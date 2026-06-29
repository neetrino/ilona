export type LandingTr = (en: string, hy: string) => string;

export interface LandingSectionProps {
  tr: LandingTr;
  isHy: boolean;
}

export interface LandingFooterProps extends LandingSectionProps {
  logoUrl: string;
}
