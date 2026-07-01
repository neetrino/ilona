'use client';

import { BranchCarousel } from './BranchCarousel';
import { LandingSectionHeader } from './LandingSectionHeader';
import { LandingScrollReveal } from './LandingScrollReveal';
import type { LandingSectionProps } from '../types';

export function LandingBranchesSection({ tr, isHy }: LandingSectionProps) {
  return (
    <section id="branches" className="scroll-mt-28 overflow-hidden bg-[#093394]">
      <div className="flex flex-col items-center gap-6 px-5 pb-12 pt-10 tablet:px-6 tablet:pb-16 tablet:pt-14">
        <LandingSectionHeader
          className="tablet:hidden"
          title={tr('Our Branches', 'Մեր մասնաճյուղերը')}
          subtitle={tr('Find the location nearest to you', 'Գտեք ձեզ ամենամոտ մասնաճյուղը')}
          titleClassName="text-[28px] font-medium leading-[42px] tracking-[0.35px] text-white"
          subtitleClassName="text-[15px] leading-[22.5px] tracking-[-0.45px] text-white/[0.58]"
        />

        <LandingScrollReveal className="hidden w-full max-w-[1216px] text-center tablet:block">
          <h2 className="text-[48px] font-medium leading-[48px] tracking-[0.3516px] text-white">
            {tr('Our Branches', 'Մեր մասնաճյուղերը')}
          </h2>
          <p className="mt-[27px] text-[20px] leading-[28px] tracking-[-0.4492px] text-white/60">
            {tr('Find the location nearest to you', 'Գտեք ձեզ ամենամոտ մասնաճյուղը')}
          </p>
        </LandingScrollReveal>

        <LandingScrollReveal className="w-full max-w-[1470px]" delay={0.08}>
          <BranchCarousel tr={tr} isHy={isHy} />
        </LandingScrollReveal>
      </div>
    </section>
  );
}
