import fs from 'fs';
import path from 'path';

const componentsDir = 'apps/web/src/features/landing/components';

function dedent(content) {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('{/*'))
    .map((line) => (line.startsWith('      ') ? line.slice(6) : line))
    .join('\n')
    .trim();
}

const configs = {
  LandingHeroSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, HERO_PERSON_IMAGE, HERO_UK_BADGE_IMAGE, HERO_US_BADGE_IMAGE } from '../landingConstants';",
      "import { paytoneOne } from '../landingFont';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
    preamble: "const heroIntroVisibilityClass = 'opacity-100';",
  },
  LandingAboutSection: {
    imports: [
      "import Image from 'next/image';",
      "import { motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { ABOUT_BIG_BEN_IMAGE, ABOUT_FLAG_IMAGE, ABOUT_SUCCESS_ICON, ABOUT_BRANCHES_ICON } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
  },
  LandingWhyChooseSection: {
    imports: [
      "import Image from 'next/image';",
      "import { motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { WHY_METHODS_IMAGE, WHY_RESULTS_IMAGE, WHY_TEACHERS_IMAGE, WHY_SCHEDULE_IMAGE } from '../landingConstants';",
      "import { whyChooseDesktopBodyBase, whyChooseDesktopBodyHy, whyChooseDesktopMethodsIconBase, whyChooseDesktopMethodsIconHy, whyChooseDesktopResultsIconWrapBase, whyChooseDesktopResultsIconWrapHy, whyChooseDesktopScheduleIconWrapBase, whyChooseDesktopTeachersIconWrapBase, whyChooseDesktopTeachersIconWrapHy, whyChooseDesktopTitleBase, whyChooseDesktopTitleHy, whyChooseMobileBodyBase, whyChooseMobileBodyHy, whyChooseMobileContentBase, whyChooseMobileContentHy, whyChooseMobileFourthContentHy, whyChooseMobileIconBase, whyChooseMobileIconHy, whyChooseMobileTitleBase, whyChooseMobileTitleHy } from '../landingStyles';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
  },
  LandingStudentSuccessSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, STUDENT_SUCCESS_IMAGE } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
  },
  LandingProgramsSection: {
    imports: [
      "import { useState } from 'react';",
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { AnimatePresence, motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, REGISTER_ARROW_IMAGE } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
    preamble: 'const [activeProgramIndex, setActiveProgramIndex] = useState(0);',
  },
  LandingBranchesSection: {
    imports: [
      "import Image from 'next/image';",
      "import { useTranslations } from 'next-intl';",
      "import { AnimatePresence, motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, BRANCH_MAP_ICON, BRANCH_NAV_ARROW } from '../landingConstants';",
      "import { useBranchCarousel } from '../hooks/useBranchCarousel';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
    preamble: `const tCommon = useTranslations('common');
  const {
    activeBranch,
    leftBranch,
    rightBranch,
    branchSlideDirection,
    hasBranchInteracted,
    goToPreviousBranch,
    goToNextBranch,
    branchImageTransition,
    branchImageVariants,
  } = useBranchCarousel();`,
  },
  LandingFollowUsSection: {
    imports: [
      "import Image from 'next/image';",
      "import { motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, FOLLOW_INSTAGRAM_ICON, FOLLOW_FACEBOOK_ICON, FOLLOW_TELEGRAM_ICON } from '../landingConstants';",
      "import { followMobileCardBase, followMobileCardHy, followMobileCardSubtitleBase, followMobileCardSubtitleHy } from '../landingStyles';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
  },
  LandingGetInTouchSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, GET_TOUCH_PHONE_ICON, GET_TOUCH_EMAIL_ICON } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr }: LandingSectionProps',
  },
  LandingJoinTeamSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, TEAM_CHECK_ICON, TEAM_SEND_CV_ICON } from '../landingConstants';",
      "import { paytoneOne } from '../landingFont';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr }: LandingSectionProps',
  },
  LandingNewsSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { motion } from 'framer-motion';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, NEWS_IMAGE_1, NEWS_IMAGE_1_OVERLAY, NEWS_IMAGE_2, NEWS_IMAGE_2_OVERLAY, NEWS_IMAGE_3, NEWS_IMAGE_3_OVERLAY, NEWS_ARROW_ICON } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr }: LandingSectionProps',
  },
  LandingFaqSection: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { BUTTON_HOVER_CLASS, FAQ_DROPDOWN_ICON, FAQ_ITEMS_EN, FAQ_ITEMS_HY } from '../landingConstants';",
      "import type { LandingSectionProps } from '../types';",
    ],
    props: '{ tr, isHy }: LandingSectionProps',
    preamble: 'const faqItems = isHy ? FAQ_ITEMS_HY : FAQ_ITEMS_EN;',
  },
  LandingFooter: {
    imports: [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { cn } from '@/shared/lib/utils';",
      "import { FOOTER_LOGO_IMAGE, FOOTER_FLAG_USA, FOOTER_FLAG_UK } from '../landingConstants';",
      "import { FooterSocialIcons } from './FooterSocialIcons';",
      "import type { FooterIconKey } from '@ilona/types';",
      "import type { LandingFooterProps } from '../types';",
    ],
    exportName: 'LandingFooter',
    props: '{ tr, isHy, logoUrl }: LandingFooterProps',
  },
};

for (const [name, config] of Object.entries(configs)) {
  const raw = fs.readFileSync(path.join(componentsDir, `${name}.tsx`), 'utf8');
  const jsx = dedent(raw);
  const exportName = config.exportName ?? name;
  const preamble = config.preamble ? `\n  ${config.preamble}\n` : '\n';

  const file = `'use client';

${config.imports.join('\n')}

export function ${exportName}(${config.props}) {${preamble}
  return (
    <>
${jsx
  .split('\n')
  .map((line) => (line ? `      ${line}` : line))
  .join('\n')}
    </>
  );
}
`;

  fs.writeFileSync(path.join(componentsDir, `${name}.tsx`), file);
  console.log(`Wrapped ${name}`);
}

console.log('Done');
