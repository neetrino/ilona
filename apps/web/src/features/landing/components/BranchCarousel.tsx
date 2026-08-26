'use client';

import { useRef, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import {
  BRANCH_CAROUSEL_CARD,
  BRANCH_CAROUSEL_TRANSITION,
} from '../branchCarouselConfig';
import { useBranchCarousel, useBranchCarouselLayout } from '../hooks/useBranchCarousel';
import type { LandingSectionProps } from '../types';

type BranchCarouselProps = Pick<LandingSectionProps, 'tr' | 'isHy'>;

const BRANCH_NAV_BUTTON_BASE =
  'inline-flex items-center justify-center rounded-full border border-white/20 bg-white text-[#093394] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-[box-shadow,background-color] duration-200 ease-out hover:bg-white hover:shadow-[0_14px_32px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#093394]';

const BRANCH_NAV_BUTTON_MOBILE_CLASS = cn(BRANCH_NAV_BUTTON_BASE, 'size-12');
const BRANCH_NAV_BUTTON_DESKTOP_CLASS = cn(BRANCH_NAV_BUTTON_BASE, 'size-14');

const BRANCH_NAV_ICON_MOBILE_CLASS = 'size-6 stroke-[2.5]';
const BRANCH_NAV_ICON_DESKTOP_CLASS = 'size-7 stroke-[2.5]';

type BranchItem = (typeof import('../landingConstants').BRANCH_CAROUSEL_ITEMS)[number];

interface BranchCarouselCardProps {
  branch: BranchItem;
  isActive: boolean;
  tr: LandingSectionProps['tr'];
  isHy: boolean;
}

function BranchCarouselCard({ branch, isActive, tr, isHy }: BranchCarouselCardProps) {
  return (
    <article
      aria-hidden={!isActive}
      className={cn('flex w-full flex-col items-center', !isActive && 'pointer-events-none')}
    >
      <motion.div
        className="w-full"
        initial={false}
        animate={{
          scale: isActive ? BRANCH_CAROUSEL_CARD.center.scale : BRANCH_CAROUSEL_CARD.side.scale,
          zIndex: isActive ? BRANCH_CAROUSEL_CARD.center.zIndex : BRANCH_CAROUSEL_CARD.side.zIndex,
        }}
        transition={{ duration: 0.55, ease: [0.45, 0, 0.2, 1] }}
        style={{ transformOrigin: '50% 20%' }}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-[24px] shadow-[0px_16px_40px_-12px_rgba(0,0,0,0.35)] transition-[border-width,border-color] duration-500 tablet:rounded-[30px]',
            isActive
              ? 'border-[3px] border-white tablet:border-[5px]'
              : 'border border-white/25',
          )}
        >
          <div className="relative h-[240px] w-full tablet:h-[301px] navDesktop:h-[424px]">
            <Image
              src={branch.image}
              alt=""
              fill
              unoptimized
              priority={isActive}
              sizes="(max-width: 744px) 340px, (max-width: 1280px) 553px, 722px"
              className="object-cover object-bottom"
            />
            <button
              type="button"
              aria-label={tr('Play branch video', 'Նվագարկել մասնաճյուղի տեսանյութ')}
              className={cn(
                'absolute left-1/2 top-1/2 z-10 flex size-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] transition-opacity duration-300 tablet:hidden',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="ml-1 block size-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#093394]" />
            </button>
          </div>
        </div>

        <div className="mt-4 w-full text-center">
          <h3
            className={cn(
              'text-[22px] font-bold leading-[33px] transition-colors duration-500 tablet:text-[26px] tablet:leading-[27px]',
              isActive ? 'text-white/[0.74] tablet:text-white/70' : 'text-white/55',
            )}
          >
            {isHy ? branch.branchNameHy : branch.branchName}
          </h3>
          <p
            className={cn(
              'mt-2 text-[14px] leading-[21px] tracking-[-0.15px] transition-colors duration-500 tablet:mt-3 tablet:text-[16px] tablet:leading-[20px] tablet:tracking-[-0.1504px]',
              isActive ? 'text-white/[0.66] tablet:text-white/70' : 'text-white/45',
            )}
          >
            {isHy ? branch.addressHy : branch.address}
          </p>
          <a
            href={branch.mapUrl}
            target="_blank"
            rel="noreferrer"
            tabIndex={isActive ? 0 : -1}
            className={cn(
              'mt-2 inline-flex items-center gap-2 text-[14px] leading-[21px] tracking-[-0.15px] text-[#ff5c56] transition-opacity duration-500 hover:opacity-80 tablet:mt-3 tablet:text-[16px] tablet:leading-[20px] tablet:tracking-[-0.1504px]',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          >
            <MapPin className="size-4" strokeWidth={2.25} />
            <span>{tr('View on map', 'Դիտել քարտեզում')}</span>
          </a>
        </div>
      </motion.div>
    </article>
  );
}

export function BranchCarousel({ tr, isHy }: BranchCarouselProps) {
  const tCommon = useTranslations('common');
  const prefersReducedMotion = useReducedMotion();
  const { cardWidth, gap, slotWidth } = useBranchCarouselLayout();
  const touchStartXRef = useRef<number | null>(null);

  const {
    branches,
    loopedBranches,
    positionIndex,
    activeIndex,
    totalItems,
    isInstantReset,
    goToNext,
    goToPrevious,
    goToIndex,
    handleSlideComplete,
  } = useBranchCarousel();

  const slideTransition: Transition = prefersReducedMotion || isInstantReset
    ? { duration: 0 }
    : BRANCH_CAROUSEL_TRANSITION;

  const trackX = -(positionIndex * slotWidth);

  const handleTouchStart = (clientX: number) => {
    touchStartXRef.current = clientX;
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartXRef.current === null || totalItems <= 1) {
      return;
    }

    const delta = clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (delta < -50) {
      goToNext();
    } else if (delta > 50) {
      goToPrevious();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (totalItems <= 1) {
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    }
  };

  const trackHeightClass =
    'relative mx-auto h-[400px] w-full max-w-[1470px] overflow-hidden tablet:h-[500px] navDesktop:h-[640px]';

  const renderTrack = () => (
    <motion.div
      className="flex will-change-transform"
      style={{ gap, paddingLeft: `calc(50% - ${cardWidth / 2}px)` }}
      initial={false}
      animate={{ x: trackX }}
      transition={slideTransition}
      onAnimationComplete={handleSlideComplete}
    >
      {loopedBranches.map((branch, index) => (
        <div
          key={`${branch.shortLabel}-${index}`}
          className="shrink-0"
          style={{ width: cardWidth }}
        >
          <BranchCarouselCard
            branch={branch}
            isActive={index === positionIndex}
            tr={tr}
            isHy={isHy}
          />
        </div>
      ))}
    </motion.div>
  );

  if (totalItems <= 1) {
    return (
      <div className="relative w-full">
        <div className={trackHeightClass}>{renderTrack()}</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={tr('Our Branches', 'Մեր մասնաճյուղերը')}
      onKeyDown={handleKeyDown}
    >
      <div
        className={trackHeightClass}
        onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        {renderTrack()}
      </div>

      <div className="mt-3 flex items-center justify-center gap-8 tablet:hidden">
        <button
          type="button"
          aria-label={tCommon('previousBranch')}
          className={BRANCH_NAV_BUTTON_MOBILE_CLASS}
          onClick={goToPrevious}
        >
          <ChevronLeft className={BRANCH_NAV_ICON_MOBILE_CLASS} aria-hidden />
        </button>
        <button
          type="button"
          aria-label={tCommon('nextBranch')}
          className={BRANCH_NAV_BUTTON_MOBILE_CLASS}
          onClick={goToNext}
        >
          <ChevronRight className={BRANCH_NAV_ICON_MOBILE_CLASS} aria-hidden />
        </button>
      </div>

      <button
        type="button"
        aria-label={tCommon('previousBranch')}
        className={cn(BRANCH_NAV_BUTTON_DESKTOP_CLASS, 'absolute left-6 top-[calc(50%-80px)] z-30 hidden -translate-y-1/2 tablet:inline-flex')}
        onClick={goToPrevious}
      >
        <ChevronLeft className={BRANCH_NAV_ICON_DESKTOP_CLASS} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={tCommon('nextBranch')}
        className={cn(BRANCH_NAV_BUTTON_DESKTOP_CLASS, 'absolute right-6 top-[calc(50%-80px)] z-30 hidden -translate-y-1/2 tablet:inline-flex')}
        onClick={goToNext}
      >
        <ChevronRight className={BRANCH_NAV_ICON_DESKTOP_CLASS} aria-hidden />
      </button>

      <div
        className="mt-3 flex items-center justify-center gap-0 tablet:absolute tablet:bottom-0 tablet:left-1/2 tablet:mt-0 tablet:gap-1 tablet:-translate-x-1/2"
        role="tablist"
        aria-label={tr('Branch carousel', 'Մասնաճյուղերի կարուսել')}
      >
        {branches.map((branch, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={branch.shortLabel}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={isHy ? branch.shortLabelHy : branch.shortLabel}
              className={cn(
                'flex h-6 min-w-6 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#093394] tablet:h-10 tablet:min-w-10 tablet:px-2',
                isActive ? 'bg-white/15' : 'hover:bg-white/10',
              )}
              onClick={() => goToIndex(index)}
            >
              <span
                className={cn(
                  'block size-1.5 rounded-full transition-colors duration-200 tablet:size-2.5',
                  isActive ? 'bg-white' : 'bg-white/40',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
