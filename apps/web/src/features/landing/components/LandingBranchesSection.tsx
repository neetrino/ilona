'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { BUTTON_HOVER_CLASS, BRANCH_MAP_ICON, BRANCH_NAV_ARROW } from '../landingConstants';
import { useBranchCarousel } from '../hooks/useBranchCarousel';
import type { LandingSectionProps } from '../types';

export function LandingBranchesSection({ tr, isHy }: LandingSectionProps) {
  const tCommon = useTranslations('common');
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
  } = useBranchCarousel();

  return (
    <>
      <section id="branches" className="overflow-hidden bg-[#093394]">
        <div className="flex flex-col items-center gap-6 px-5 pb-12 pt-10 tablet:hidden">
          <div className="text-center">
            <h2 className="text-[28px] font-medium leading-[42px] tracking-[0.35px] text-white">
              {tr('Our Branches', 'Մեր մասնաճյուղերը')}
            </h2>
            <p className="mt-2 text-[15px] leading-[22.5px] tracking-[-0.45px] text-white/[0.58]">
              {tr('Find the location nearest to you', 'Գտեք ձեզ ամենամոտ մասնաճյուղը')}
            </p>
          </div>
      
          <div className="relative h-[240px] w-full overflow-hidden rounded-[24px] border-[3px] border-white">
            <AnimatePresence initial={false} custom={branchSlideDirection} mode="sync">
              <motion.div
                key={`mobile-branch-image-${activeBranch.shortLabel}`}
                className="absolute inset-0"
                custom={branchSlideDirection}
                variants={branchImageVariants}
                initial={hasBranchInteracted ? 'enter' : false}
                animate="center"
                exit="exit"
                transition={branchImageTransition}
              >
                <Image
                  src={activeBranch.image}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="100vw"
                  className="object-cover object-bottom"
                />
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              aria-label={tr('Play branch video', 'Նվագարկել մասնաճյուղի տեսանյութ')}
              className="absolute left-1/2 top-1/2 z-10 flex size-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
            >
              <span className="ml-1 block size-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#093394]" />
            </button>
          </div>
      
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h3 className="text-[22px] font-bold leading-[33px] text-white/[0.74]">
              {isHy ? activeBranch.branchNameHy : activeBranch.branchName}
            </h3>
            <p className="text-[14px] leading-[21px] tracking-[-0.15px] text-white/[0.66]">
              {isHy ? activeBranch.addressHy : activeBranch.address}
            </p>
            <a
              href={activeBranch.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[14px] leading-[21px] tracking-[-0.15px] text-[#ff5c56] transition-opacity hover:opacity-80"
            >
              <Image src={BRANCH_MAP_ICON} alt="" width={16} height={16} unoptimized />
              <span>{tr('View on map', 'Դիտել քարտեզում')}</span>
            </a>
          </div>
      
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label={tCommon('previousBranch')}
              className={cn(
                'inline-flex size-[56px] items-center justify-center',
                BUTTON_HOVER_CLASS,
              )}
              onClick={goToPreviousBranch}
            >
              <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized />
            </button>
            <button
              type="button"
              aria-label={tCommon('nextBranch')}
              className={cn(
                'inline-flex size-[56px] items-center justify-center',
                BUTTON_HOVER_CLASS,
              )}
              onClick={goToNextBranch}
            >
              <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized className="rotate-180" />
            </button>
          </div>
        </div>
      
        <div className="relative mx-auto hidden h-[878px] w-full max-w-[1470px] px-6 tablet:block">
          <div className="absolute left-1/2 top-[81px] w-full max-w-[1216px] -translate-x-1/2 text-center">
            <h2 className="text-[48px] font-medium leading-[48px] tracking-[0.3516px] text-white">
              {tr('Our Branches', 'Մեր մասնաճյուղերը')}
            </h2>
            <p className="mt-[27px] text-[20px] leading-[28px] tracking-[-0.4492px] text-white/60">
              {tr('Find the location nearest to you', 'Գտեք ձեզ ամենամոտ մասնաճյուղը')}
            </p>
          </div>
      
          <div className="absolute left-[68px] top-[313px] h-[301px] w-[553px] overflow-hidden rounded-[30px]">
            <AnimatePresence initial={false} custom={branchSlideDirection} mode="sync">
              <motion.div
                key={`left-image-${leftBranch.shortLabel}`}
                className="absolute inset-0"
                custom={branchSlideDirection}
                variants={branchImageVariants}
                initial={hasBranchInteracted ? 'enter' : false}
                animate="center"
                exit="exit"
                transition={branchImageTransition}
              >
                <Image
                  src={leftBranch.image}
                  alt=""
                  fill
                  unoptimized
                  loading="eager"
                  fetchPriority="high"
                  sizes="553px"
                  className="object-cover object-bottom"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="absolute left-[253px] top-[627px] text-[26px] font-bold leading-[27px] text-white/70">
            {isHy ? leftBranch.shortLabelHy : leftBranch.shortLabel}
          </p>
      
          <div className="absolute left-[869px] top-[313px] h-[301px] w-[553px] overflow-hidden rounded-[30px]">
            <AnimatePresence initial={false} custom={branchSlideDirection} mode="sync">
              <motion.div
                key={`right-image-${rightBranch.shortLabel}`}
                className="absolute inset-0"
                custom={branchSlideDirection}
                variants={branchImageVariants}
                initial={hasBranchInteracted ? 'enter' : false}
                animate="center"
                exit="exit"
                transition={branchImageTransition}
              >
                <Image
                  src={rightBranch.image}
                  alt=""
                  fill
                  unoptimized
                  loading="eager"
                  fetchPriority="high"
                  sizes="553px"
                  className="object-cover object-bottom"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="absolute left-[934px] top-[627px] text-[26px] font-bold leading-[27px] text-white/70">
            {isHy ? rightBranch.shortLabelHy : rightBranch.shortLabel}
          </p>
      
          <div className="absolute left-1/2 top-[251px] h-[424px] w-[722px] -translate-x-1/2 overflow-hidden rounded-[30px] border-[5px] border-white">
            <AnimatePresence initial={false} custom={branchSlideDirection} mode="sync">
              <motion.div
                key={`center-image-${activeBranch.shortLabel}`}
                className="absolute inset-0"
                custom={branchSlideDirection}
                variants={branchImageVariants}
                initial={hasBranchInteracted ? 'enter' : false}
                animate="center"
                exit="exit"
                transition={branchImageTransition}
              >
                <Image
                  src={activeBranch.image}
                  alt=""
                  fill
                  unoptimized
                  loading="eager"
                  fetchPriority="high"
                  sizes="722px"
                  className="object-cover object-bottom"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <button
            type="button"
            aria-label={tCommon('previousBranch')}
            className={cn(
              'absolute left-[40px] top-[444px] inline-flex h-[56px] w-[56px] items-center justify-center',
              BUTTON_HOVER_CLASS,
            )}
            onClick={goToPreviousBranch}
          >
            <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized />
          </button>
          <button
            type="button"
            aria-label={tCommon('nextBranch')}
            className={cn(
              'absolute right-[40px] top-[444px] inline-flex h-[56px] w-[56px] items-center justify-center',
              BUTTON_HOVER_CLASS,
            )}
            onClick={goToNextBranch}
          >
            <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized className="rotate-180" />
          </button>
      
          <div className="absolute left-1/2 top-[698px] w-[334px] -translate-x-1/2 text-center">
            <h3 className="text-[26px] font-bold leading-[27px] text-white/70">
              {isHy ? activeBranch.branchNameHy : activeBranch.branchName}
            </h3>
            <p className="mt-3 text-[16px] leading-[20px] tracking-[-0.1504px] text-white/70">
              {isHy ? activeBranch.addressHy : activeBranch.address}
            </p>
            <a
              href={activeBranch.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[16px] leading-[20px] tracking-[-0.1504px] text-[#ff5c56] transition-opacity hover:opacity-80"
            >
              <Image src={BRANCH_MAP_ICON} alt="" width={16} height={16} unoptimized />
              <span>{tr('View on map', 'Դիտել քարտեզում')}</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
