'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, HERO_PERSON_IMAGE, HERO_UK_BADGE_IMAGE, HERO_US_BADGE_IMAGE } from '../landingConstants';
import { landingHeroEntranceVariants, landingHeroTransition, landingRevealTransition } from '../landingAnimations';
import { paytoneOne } from '../landingFont';
import type { LandingSectionProps } from '../types';

export function LandingHeroSection({ tr, isHy }: LandingSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const heroIntroVisibilityClass = prefersReducedMotion ? 'opacity-100' : undefined;

  const heroTextMotion = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        variants: landingHeroEntranceVariants,
        transition: landingRevealTransition(0),
      };

  const heroSubtextMotion = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        variants: landingHeroEntranceVariants,
        transition: landingRevealTransition(0.12),
      };

  const heroCtaMotion = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        variants: landingHeroEntranceVariants,
        transition: landingRevealTransition(0.24),
      };

  const heroImageMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        transition: landingHeroTransition(0.08, 0.8),
      };

  const heroBadgeMotion = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, scale: 0.92 },
          animate: { opacity: 1, scale: 1 },
          transition: landingHeroTransition(delay),
        };

  return (
    <>
      <section
        id="home"
        className="relative scroll-mt-28 max-tablet:bg-[#f9fafb] max-tablet:pt-[105px] max-tablet:overflow-x-visible max-tablet:pb-0 tablet:z-0 tablet:h-[810px] tablet:min-h-[810px] tablet:overflow-hidden tablet:bg-white tablet:pt-0 tablet:max-navDesktop:overflow-visible tablet:max-navDesktop:pt-[48px] navDesktop:overflow-hidden"
      >
        <div className="relative isolate w-full min-h-[1050px] overflow-visible tablet:hidden">
          <div
            className={cn(
              'absolute left-[14px] top-[20px] z-20 text-[#093394]',
              isHy ? 'w-[250px]' : 'w-[220px]',
            )}
          >
            <motion.h1
              {...heroTextMotion}
              className={cn(
                isHy ? '' : paytoneOne.className,
                isHy
                  ? 'text-[1.85rem] font-extrabold leading-[2.5rem] tracking-[0.004rem]'
                  : 'text-[2.75rem] font-normal leading-[2.55rem] tracking-[0.018rem]',
              )}
            >
              {tr('Learn English', 'Սովորիր անգլերեն')}
              <br />
              {tr('with Confidence', 'վստահությամբ')}
            </motion.h1>
          </div>
      
          <motion.p
            {...heroSubtextMotion}
            className={cn(
              'absolute left-[17px] z-20 w-[150px] text-[14px] leading-[22px] tracking-[0.07px] text-black/50',
              isHy ? 'top-[198px]' : 'top-[218px]',
            )}
          >
            {tr(
              'Expert teachers, modern methods, and proven results. Your journey to fluency starts here.',
              'Փորձառու ուսուցիչներ, ժամանակակից մեթոդներ և իրական արդյունքներ։ Ձեր անգլերենի ճանապարհը սկսվում է այստեղ։',
            )}
          </motion.p>
      
          <motion.div
            {...heroBadgeMotion(0.16)}
            className="absolute -right-[113px] top-[34px] z-[2] h-[231px] w-[231px] overflow-hidden rounded-full"
          >
            <Image
              src={HERO_UK_BADGE_IMAGE}
              alt="UK flag badge"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="231px"
              className="object-cover object-center"
            />
          </motion.div>
      
          <motion.div
            {...heroBadgeMotion(0.22)}
            className="absolute left-[58px] top-[420px] z-[2] h-[236px] w-[236px] overflow-hidden rounded-full"
          >
            <Image
              src={HERO_US_BADGE_IMAGE}
              alt="US flag badge"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="236px"
              className="object-cover object-[20%_center]"
            />
          </motion.div>
      
          <motion.div
            {...heroImageMotion}
            className="pointer-events-none absolute left-[24px] top-[148px] z-10 h-[900px] w-[520px] overflow-visible"
          >
            <div className="relative h-full w-full overflow-hidden rounded-t-[155px]">
              <Image
                src={HERO_PERSON_IMAGE}
                alt="Hero student illustration"
                fill
                priority
                loading="eager"
                fetchPriority="high"
                sizes="520px"
                className="object-cover object-top"
              />
            </div>
          </motion.div>
      
          <motion.div {...heroCtaMotion} className="absolute left-3 right-3 top-[685px] z-20">
            <Link
              href="#branches"
              className={cn(
                'inline-flex h-[52px] w-full items-center justify-center rounded-[999px] border border-[#1447e6] bg-white/10 text-[14px] font-normal text-[#1548e6] backdrop-blur-md',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('Choose Branch', 'Ընտրել մասնաճյուղ')}
            </Link>
          </motion.div>
        </div>
      
        <div className="relative -top-4 mx-auto max-tablet:hidden h-full w-full max-w-[1280px] overflow-hidden tablet:max-navDesktop:top-0 tablet:max-navDesktop:overflow-visible navDesktop:-top-[16px] navDesktop:overflow-hidden">
          <div
            className={cn(
              'absolute top-[227px] w-[992px] text-[#093394] transition-opacity duration-300',
              heroIntroVisibilityClass,
              isHy ? 'left-[33px]' : 'left-[36px]',
            )}
          >
            <motion.h1
              {...heroTextMotion}
              className={cn(
                isHy ? '' : paytoneOne.className,
                isHy
                  ? 'text-[5.1rem] not-italic font-extrabold leading-[5.7rem] tracking-[0.004rem]'
                  : 'text-[5.75rem] not-italic font-normal leading-[6.375rem] tracking-[0.00769rem]',
              )}
            >
              {tr('Learn English', 'Սովորիր անգլերեն')}
              <br />
              {tr('with Confidence', 'վստահությամբ')}
            </motion.h1>
          </div>
      
          <motion.p
            {...heroSubtextMotion}
            className={cn(
              'absolute left-[36px] top-[470px] w-[486px] text-[16px] font-normal leading-[24px] tracking-[0.0703px] text-black/50',
              heroIntroVisibilityClass,
            )}
          >
            {tr(
              'Expert teachers, modern methods, and proven results. Your journey to fluency starts here.',
              'Փորձառու ուսուցիչներ, ժամանակակից մեթոդներ և իրական արդյունքներ։ Ձեր անգլերենի ճանապարհը սկսվում է այստեղ։',
            )}
          </motion.p>
      
          <motion.div {...heroCtaMotion} className="absolute left-[36px] top-[586px]">
            <Link
              href="#branches"
              className={cn(
                'inline-flex h-[60px] w-[199.055px] items-center justify-center rounded-[16777200px] border-2 border-[#1447e6] bg-[rgba(255,255,255,0.1)] text-[16px] font-normal tracking-[-0.3125px] text-[#1548e6]',
                heroIntroVisibilityClass,
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('Choose Branch', 'Ընտրել մասնաճյուղ')}
            </Link>
          </motion.div>
      
          <motion.div
            {...heroBadgeMotion(0.18)}
            className="absolute left-[990px] top-[158px] h-[290px] w-[290px] overflow-hidden rounded-full"
          >
            <Image
              src={HERO_UK_BADGE_IMAGE}
              alt="UK flag badge"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="290px"
              className="object-cover object-[90%_center]"
            />
          </motion.div>
          <motion.div
            {...heroBadgeMotion(0.24)}
            className="absolute left-[654px] top-[454px] h-[281px] w-[281px] overflow-hidden rounded-full"
          >
            <Image
              src={HERO_US_BADGE_IMAGE}
              alt="US flag badge"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="281px"
              className="object-cover object-[20%_center]"
            />
          </motion.div>
          <motion.div
            {...heroImageMotion}
            className="absolute left-[789px] top-[140px] z-20 h-[873px] w-[393px] tablet:max-navDesktop:top-[88px] tablet:max-navDesktop:z-[1] navDesktop:top-[140px] navDesktop:z-20"
          >
            <Image
              src={HERO_PERSON_IMAGE}
              alt="Hero student illustration"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="393px"
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>
    </>
  );
}
