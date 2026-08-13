'use client';

import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { ABOUT_BIG_BEN_IMAGE, ABOUT_FLAG_IMAGE, ABOUT_SUCCESS_ICON, ABOUT_BRANCHES_ICON } from '../landingConstants';
import type { LandingSectionProps } from '../types';

const mobileAboutViewport = { once: true, amount: 0.2 } as const;

const mobileAboutContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const mobileFadeFromLeft: Variants = {
  hidden: { x: -28, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const mobileBigBenVariants: Variants = {
  hidden: { x: 36, opacity: 0 },
  visible: {
    x: [36, -12, 8, 0],
    opacity: 1,
    transition: { duration: 1.1, ease: 'easeOut' },
  },
};

const mobileBadgeFromRight: Variants = {
  hidden: { x: 70, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const mobileBadgeFromLeft: Variants = {
  hidden: { x: -70, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const mobileStatsVariants: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: 'easeOut' },
  },
};

export function LandingAboutSection({ tr, isHy }: LandingSectionProps) {
  const aboutTag = tr('About', 'About');
  const aboutHeading = tr('About Us', 'Մեր մասին');
  const aboutLead = tr(
    'Ilona English Centre was founded in 2022 to create a modern, effective, and inspiring environment for learning English. Our original methodology is based on active learning: students speak from the very first lesson and systematically develop the core language skills — speaking, listening, reading, writing. After successfully completing each level, the student receives a corresponding Ilona English Center certificate confirming successful completion of that level.',
    'Ilona English Centre-ը հիմնադրվել է 2022 թվականին՝ ժամանակակից, արդյունավետ և ոգեշնչող անգլերենի ուսուցման միջավայր ստեղծելու նպատակով։ Մեր հեղինակային մեթոդաբանությունը հիմնված է ակտիվ ուսուցման վրա․ սովորողները խոսում են հենց առաջին դասից և համակարգված զարգացնում են լեզվական հիմնական հմտությունները՝ speaking, listening, reading, writing։ Յուրաքանչյուր մակարդակի դասընթացի հաջող ավարտից հետո սովորողը ստանում է Ilona English Center-ի համապատասխան վկայական, որը հավաստում է տվյալ մակարդակի հաջողված ավարտը։',
  );
  const aboutGroups = tr(
    'Groups are divided by levels…',
    'Խմբերը բաժանված են ըստ մակարդակների …',
  );

  return (
    <>
      <section
        id="about"
        className="relative scroll-mt-28 overflow-hidden bg-[#dde7ff] max-tablet:z-20 max-tablet:-mt-[200px] max-tablet:pb-0 max-tablet:pt-0 tablet:-mt-[16px] tablet:max-navDesktop:z-10 tablet:max-navDesktop:-mt-[32px] navDesktop:z-auto navDesktop:-mt-[16px] tablet:h-[840px]"
      >
        <motion.div
          className="tablet:hidden"
          initial="hidden"
          whileInView="visible"
          viewport={mobileAboutViewport}
          variants={mobileAboutContainerVariants}
        >
        <div
          className="pointer-events-none absolute inset-0 bg-[#dde7ff]"
          aria-hidden
        />
      
        <motion.div
          className="absolute left-5 top-6 z-30 max-w-[237px]"
          variants={mobileFadeFromLeft}
        >
          <h2 className="text-[30px] font-extrabold leading-[31px] tracking-[0.35px] text-[#0a0a0a]">
            {aboutHeading}
          </h2>
        </motion.div>
      
        <motion.div
          className="relative z-10 mx-auto flex min-h-[640px] w-full flex-col bg-[#dde7ff] px-5 pb-0 pt-[200px]"
          variants={mobileAboutContainerVariants}
        >
          <motion.div
            className="pointer-events-none absolute right-[-270px] top-[-80px] z-[1] flex h-[900px] w-[440px] items-center justify-center"
            variants={mobileBigBenVariants}
          >
            <div className="-scale-y-100 rotate-[171.43deg]">
              <div className="relative h-[860px] w-[350px]">
                <Image
                  src={ABOUT_BIG_BEN_IMAGE}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="350px"
                  className="object-cover object-left"
                />
              </div>
            </div>
          </motion.div>
      
          <motion.div
            className="absolute right-16 top-[62px] z-10"
            variants={mobileBadgeFromRight}
          >
            <div className="rotate-[6deg] rounded-full bg-[#093394] px-4 py-1.5">
              <span className="text-[12px] font-bold leading-[18px] text-white">
                {tr('15+ Years', '15+ տարի')}
              </span>
            </div>
          </motion.div>
      
          <motion.div
            className="absolute right-12 top-[180px] z-10"
            variants={mobileBadgeFromRight}
          >
            <div className="-rotate-[19deg] rounded-full bg-white px-4 py-1.5">
              <span className="text-[13px] font-bold leading-[19.5px] text-[#0025db]">
                {aboutTag}
              </span>
            </div>
          </motion.div>
      
          <motion.div
            className="absolute right-[72px] top-[310px] z-10"
            variants={mobileBadgeFromLeft}
          >
            <div className="-rotate-6 rounded-full bg-[#fb2c36] px-4 py-1.5">
              <span className="text-[12px] font-bold leading-[18px] text-white">
                {tr('Since 2011', '2011-ից')}
              </span>
            </div>
          </motion.div>
      
          <div className="min-h-1 flex-1" aria-hidden />

          <motion.div
            className={cn(
              'relative z-10 mb-4 space-y-3 tracking-[-0.44px] text-[#4a5565]',
              isHy ? 'text-[14px] leading-[20px]' : 'text-[17px] leading-[22px]',
            )}
            variants={mobileFadeFromLeft}
          >
            <p>{aboutLead}</p>
            <p>{aboutGroups}</p>
          </motion.div>
      
          <motion.div
            className="relative z-10 mb-6 grid shrink-0 grid-cols-2 gap-3"
            variants={mobileStatsVariants}
          >
            <div className="rounded-[20px] bg-white px-5 py-5">
              <Image src={ABOUT_SUCCESS_ICON} alt="" width={32} height={32} unoptimized />
              <p className="mt-3 text-[26px] font-bold leading-[39px] tracking-[0.4px] text-[#0a0a0a]">
                95%
              </p>
              <p className="mt-1 text-[13px] leading-6 tracking-[-0.31px] text-[#4a5565]">
                {tr('Success Rate', 'Հաջողության տոկոս')}
              </p>
            </div>
            <div className="rounded-[20px] bg-white px-5 py-5">
              <Image src={ABOUT_BRANCHES_ICON} alt="" width={32} height={32} unoptimized />
              <p className="mt-3 text-[26px] font-bold leading-[39px] tracking-[0.4px] text-[#0a0a0a]">
                4
              </p>
              <p className="mt-1 text-[13px] leading-6 tracking-[-0.31px] text-[#4a5565]">
                {tr('Branches', 'Մասնաճյուղեր')}
              </p>
            </div>
          </motion.div>
        </motion.div>
        </motion.div>
      
        <div className="relative z-10 mx-auto max-tablet:hidden h-full w-full max-w-[1280px] px-6">
          <div className="absolute left-1/2 top-[80px] h-[700px] w-full max-w-[1152px] -translate-x-1/2">
            <div className="absolute left-[608px] top-0 w-[544px]">
              <div className="inline-flex h-[36px] items-center rounded-full bg-white px-4">
                <span className="text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#0025db]">
                  {aboutTag}
                </span>
              </div>
              <h2 className="mt-[24px] text-[48px] font-extrabold leading-[60px] tracking-[0.3516px] text-[#0a0a0a]">
                {aboutHeading}
              </h2>
              <p className="mt-[24px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                {aboutLead}
              </p>
              <p className="mt-[16px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                {aboutGroups}
              </p>
      
              <div className="mt-[24px] flex gap-6">
                <div className="h-[152px] w-[260px] rounded-[24px] bg-white px-6 pt-6">
                  <Image src={ABOUT_SUCCESS_ICON} alt="" width={32} height={32} unoptimized />
                  <p className="mt-3 text-[40px] font-bold leading-[36px] tracking-[0.3955px] text-[#0a0a0a]">
                    95%
                  </p>
                  <p className="mt-1 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    {tr('Success Rate', 'Հաջողության տոկոս')}
                  </p>
                </div>
                <div className="h-[152px] w-[260px] rounded-[24px] bg-white px-6 pt-6">
                  <Image src={ABOUT_BRANCHES_ICON} alt="" width={32} height={32} unoptimized />
                  <p className="mt-3 text-[40px] font-bold leading-[36px] tracking-[0.3955px] text-[#0a0a0a]">
                    4
                  </p>
                  <p className="mt-1 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    {tr('Branches', 'Մասնաճյուղեր')}
                  </p>
                </div>
              </div>
            </div>
      
            <motion.div
              className="absolute left-[100px] top-[60px]"
              initial={{ x: -90, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
              viewport={{ once: true, amount: 0.6 }}
            >
              <div className="rotate-[-12deg] rounded-full bg-[#fb2c36] px-6 py-3">
                <span className="text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-white">
                  {tr('Since 2011', '2011-ից')}
                </span>
              </div>
            </motion.div>
          </div>
      
          <motion.div
            className="absolute left-[24px] top-[-59px] h-[985px] w-[535px]"
            initial={{ x: -36, opacity: 0 }}
            whileInView={{ x: [-36, 12, -8, 0], opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.55 }}
          >
            <div className="relative h-full w-full rotate-[-168.83deg] scale-y-[-1]">
              <Image
                src={ABOUT_BIG_BEN_IMAGE}
                alt=""
                fill
                className="object-contain"
                unoptimized
                loading="lazy"
                sizes="535px"
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute left-[201px] top-[244px] h-[660px] w-[530px]"
            initial={{ x: 36, opacity: 0 }}
            whileInView={{ x: [36, -12, 8, 0], opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.55 }}
          >
            <div className="relative h-full w-full rotate-[-6.86deg]">
              <Image
                src={ABOUT_FLAG_IMAGE}
                alt=""
                fill
                className="object-contain scale-[1.36] origin-center"
                unoptimized
                loading="lazy"
                sizes="530px"
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute left-[425px] top-[286px]"
            initial={{ x: 90, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.12 }}
            viewport={{ once: true, amount: 0.6 }}
          >
            <div className="rotate-[12deg] rounded-full bg-[#093394] px-6 py-3">
              <span className="text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-white">
                {tr('15+ Years', '15+ տարի')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
