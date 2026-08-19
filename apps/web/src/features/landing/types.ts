import type { LandingNavSectionId } from './landingNav';

export type LandingTr = (en: string, hy: string) => string;

export interface LandingSectionProps {
  tr: LandingTr;
  isHy: boolean;
}

export interface LandingHeroSectionProps extends LandingSectionProps {
  onSectionNavigate?: (sectionId: LandingNavSectionId) => void;
}

export interface LandingFooterProps extends LandingSectionProps {
  logoUrl: string;
}
