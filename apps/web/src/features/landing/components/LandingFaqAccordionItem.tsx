'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { FAQ_DROPDOWN_ICON } from '../landingConstants';

interface LandingFaqAccordionItemProps {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function LandingFaqAccordionItem({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}: LandingFaqAccordionItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const panelId = `faq-panel-${id}`;
  const buttonId = `faq-button-${id}`;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[20px] border bg-white shadow-sm transition-[border-color,box-shadow] duration-500 tablet:rounded-[24px]',
        isOpen
          ? 'border-[#c7dcff] shadow-[0px_20px_44px_-16px_rgba(9,51,148,0.22)]'
          : 'border-white hover:border-[#e8f0ff] hover:shadow-[0px_12px_28px_-14px_rgba(9,51,148,0.18)]',
      )}
    >
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left tablet:gap-4 tablet:px-6 tablet:py-6"
      >
        <span className="text-[15px] font-medium leading-[26px] tracking-[-0.44px] text-[#101828] tablet:text-[18px] tablet:leading-[28px] tablet:tracking-[-0.4395px]">
          {question}
        </span>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bedbff] shadow-[0px_4px_3px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-out tablet:size-10',
            isOpen && 'rotate-180 bg-gradient-to-br from-[#155dfc] to-[#093394]',
          )}
        >
          <Image
            src={FAQ_DROPDOWN_ICON}
            alt=""
            width={16}
            height={16}
            unoptimized
            className={cn('translate-y-[1px] transition-[filter] duration-300 tablet:h-5 tablet:w-5', isOpen && 'brightness-0 invert')}
          />
        </span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        initial={false}
        animate={
          prefersReducedMotion
            ? { height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }
            : { height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }
        }
        transition={{
          height: { duration: 0.55, ease: [0.32, 0.72, 0, 1] },
          opacity: { duration: prefersReducedMotion ? 0.15 : 0.4, ease: 'easeOut', delay: isOpen && !prefersReducedMotion ? 0.08 : 0 },
        }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 tablet:px-6 tablet:pb-6">
          <motion.div
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: isOpen ? 1 : 0, y: 0 }
                : { opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -8 }
            }
            transition={{
              opacity: { duration: 0.35, ease: 'easeOut', delay: isOpen ? 0.1 : 0 },
              y: { duration: 0.45, ease: [0.32, 0.72, 0, 1], delay: isOpen ? 0.08 : 0 },
            }}
            className="relative overflow-hidden rounded-[16px] border border-[#dbeafe]/70 bg-gradient-to-br from-[#f8fbff] via-[#f1f6ff] to-[#eef3ff] px-4 py-4 tablet:rounded-[18px] tablet:px-5 tablet:py-5"
          >
            <div className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#155dfc] to-[#60a5fa]" />
            <p className="pl-3 text-[14px] leading-[22px] tracking-[-0.2px] text-[#4a5565] tablet:pl-4 tablet:text-[16px] tablet:leading-[26px] tablet:tracking-[-0.31px]">
              {answer}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </article>
  );
}
