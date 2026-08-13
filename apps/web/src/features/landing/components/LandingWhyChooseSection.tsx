'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { WHY_METHODS_IMAGE, WHY_RESULTS_IMAGE, WHY_TEACHERS_IMAGE, WHY_SCHEDULE_IMAGE } from '../landingConstants';
import { whyChooseDesktopBodyBase, whyChooseDesktopBodyHy, whyChooseDesktopMethodsIconBase, whyChooseDesktopMethodsIconHy, whyChooseDesktopResultsIconWrapBase, whyChooseDesktopResultsIconWrapHy, whyChooseDesktopScheduleIconWrapBase, whyChooseDesktopTeachersIconWrapBase, whyChooseDesktopTeachersIconWrapHy, whyChooseDesktopTitleBase, whyChooseDesktopTitleHy, whyChooseMobileBodyBase, whyChooseMobileBodyHy, whyChooseMobileContentBase, whyChooseMobileContentHy, whyChooseMobileFourthContentHy, whyChooseMobileIconBase, whyChooseMobileIconHy, whyChooseMobileTitleBase, whyChooseMobileTitleHy } from '../landingStyles';
import { LandingScrollReveal } from './LandingScrollReveal';
import type { LandingSectionProps } from '../types';

export function LandingWhyChooseSection({ tr, isHy }: LandingSectionProps) {
  const sectionTitle = tr('Why Choose Us', 'Ինչու ընտրել մեզ');
  const sectionSubtitle = tr('Experience the difference', 'Զգացեք տարբերությունը');
  const environmentTitle = tr('Modern Environment', 'Ժամանակակից միջավայր');
  const environmentBody = tr(
    'A welcoming learning environment equipped with advanced technology designed for classes',
    'Հաճելի կրթական միջավայր՝ դասերի համար նախատեսված բարձրագույն տեխնոլոգիաներով',
  );
  const certificateTitle = tr('Level Certificate', 'Մակարդակի վկայական');
  const certificateBody = tr(
    'Upon completion of each level, IEC issues the corresponding certificate',
    'Յուրաքանչյուր մակարդակի ավարտին IEC-ն տրամադրում է համապատասխան վկայական',
  );
  const teachersTitle = tr('Experienced Teachers', 'Փորձառու ուսուցիչներ');
  const teachersBody = tr(
    'Certified specialists with international experience and boundless energy',
    'Հավաստագրված մասնագետներ՝ միջազգային փորձով և անսպառ եռանդով',
  );
  const platformTitle = tr(
    'IEC Internal Digital Learning Platform',
    'IEC ներքին թվային ուսումնական հարթակը',
  );
  const platformBody = tr(
    "Exclusively for the centre's teachers and students, where students have their personal accounts and regularly receive information and feedback from their teacher on their progress, achievements, and future goals.",
    'Բացառապես կենտրոնի ուսուցիչների և սովորողների համար, որտեղ սովորողներն ունեն իրենց անձնական հաշիվները և պարբերաբար ստանում են իրենց առաջընթացի, ձեռքբերումների և հետագա նպատակների վերաբերյալ տեղեկություններն ու հետադարձ կապը ուսուցչի կողմից։',
  );

  return (
    <>
      <section className="relative overflow-hidden bg-white max-tablet:-mt-px tablet:min-h-[764px] tablet:pb-20 scroll-mt-28" id="teachers">
        <div className="flex flex-col gap-8 px-5 pb-10 pt-10 tablet:hidden">
          <LandingScrollReveal className="text-center">
            <h2 className="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]">
              {sectionTitle}
            </h2>
            <p className="mt-2 text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]">
              {sectionSubtitle}
            </p>
          </LandingScrollReveal>
      
          <div className="grid grid-cols-2 gap-4">
            <motion.article
              className="relative min-h-[220px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-4 pb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image
                src={WHY_METHODS_IMAGE}
                alt=""
                width={110}
                height={110}
                unoptimized
                loading="lazy"
                className={isHy ? whyChooseMobileIconHy : whyChooseMobileIconBase}
              />
              <div className={isHy ? whyChooseMobileContentHy : whyChooseMobileContentBase}>
                <h3 className={isHy ? whyChooseMobileTitleHy : whyChooseMobileTitleBase}>
                  {environmentTitle}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {environmentBody}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative min-h-[220px] overflow-hidden rounded-[24px] bg-[#ffd2d2] px-4 pb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image
                src={WHY_RESULTS_IMAGE}
                alt=""
                width={110}
                height={110}
                unoptimized
                loading="lazy"
                className={isHy ? whyChooseMobileIconHy : whyChooseMobileIconBase}
              />
              <div className={isHy ? whyChooseMobileContentHy : whyChooseMobileContentBase}>
                <h3 className={isHy ? whyChooseMobileTitleHy : whyChooseMobileTitleBase}>
                  {certificateTitle}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {certificateBody}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative min-h-[220px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dff2fe] px-4 pb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image
                src={WHY_TEACHERS_IMAGE}
                alt=""
                width={110}
                height={110}
                unoptimized
                loading="lazy"
                className={isHy ? whyChooseMobileIconHy : whyChooseMobileIconBase}
              />
              <div className={isHy ? whyChooseMobileContentHy : whyChooseMobileContentBase}>
                <h3 className={isHy ? whyChooseMobileTitleHy : whyChooseMobileTitleBase}>
                  {teachersTitle}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {teachersBody}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative min-h-[220px] overflow-hidden rounded-[24px] bg-[rgba(132,169,255,0.52)] px-4 pb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.24 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image
                src={WHY_SCHEDULE_IMAGE}
                alt=""
                width={110}
                height={110}
                unoptimized
                loading="lazy"
                className={isHy ? whyChooseMobileIconHy : whyChooseMobileIconBase}
              />
              <div
                className={
                  isHy ? whyChooseMobileFourthContentHy : whyChooseMobileContentBase
                }
              >
                <h3 className={isHy ? whyChooseMobileTitleHy : whyChooseMobileTitleBase}>
                  {platformTitle}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {platformBody}
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      
        <div className="max-tablet:hidden">
          <div className="pt-20 text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {sectionTitle}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {sectionSubtitle}
            </p>
          </div>
      
          <div className="mx-auto mt-[95px] grid w-full max-w-[1216px] grid-cols-4 gap-8 px-6">
            <motion.article
              className="relative min-h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-[34px] pb-8"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <Image
                src={WHY_METHODS_IMAGE}
                alt=""
                width={251}
                height={251}
                unoptimized
                className={isHy ? whyChooseDesktopMethodsIconHy : whyChooseDesktopMethodsIconBase}
              />
              <h3 className={isHy ? whyChooseDesktopTitleHy : whyChooseDesktopTitleBase}>
                {environmentTitle}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {environmentBody}
              </p>
            </motion.article>
      
            <motion.article
              className="relative min-h-[366px] overflow-hidden rounded-[24px] bg-[#ffd2d2] px-[34px] pb-8"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div
                className={
                  isHy ? whyChooseDesktopResultsIconWrapHy : whyChooseDesktopResultsIconWrapBase
                }
              >
                <Image
                  src={WHY_RESULTS_IMAGE}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="294px"
                  className="object-contain"
                />
              </div>
              <h3 className={isHy ? whyChooseDesktopTitleHy : whyChooseDesktopTitleBase}>
                {certificateTitle}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {certificateBody}
              </p>
            </motion.article>
      
            <motion.article
              className="relative min-h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dff2fe] px-[34px] pb-8"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div
                className={
                  isHy ? whyChooseDesktopTeachersIconWrapHy : whyChooseDesktopTeachersIconWrapBase
                }
              >
                <Image
                  src={WHY_TEACHERS_IMAGE}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="266px"
                  className="object-contain"
                />
              </div>
              <h3 className={isHy ? whyChooseDesktopTitleHy : whyChooseDesktopTitleBase}>
                {teachersTitle}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {teachersBody}
              </p>
            </motion.article>
      
            <motion.article
              className="relative min-h-[366px] overflow-hidden rounded-[24px] bg-[rgba(132,169,255,0.52)] px-[34px] pb-8"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.24 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className={whyChooseDesktopScheduleIconWrapBase}>
                <Image
                  src={WHY_SCHEDULE_IMAGE}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="244px"
                  className="object-contain"
                />
              </div>
              <h3 className={isHy ? whyChooseDesktopTitleHy : whyChooseDesktopTitleBase}>
                {platformTitle}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {platformBody}
              </p>
            </motion.article>
          </div>
        </div>
      </section>
    </>
  );
}
