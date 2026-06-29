'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { WHY_METHODS_IMAGE, WHY_RESULTS_IMAGE, WHY_TEACHERS_IMAGE, WHY_SCHEDULE_IMAGE } from '../landingConstants';
import { whyChooseDesktopBodyBase, whyChooseDesktopBodyHy, whyChooseDesktopMethodsIconBase, whyChooseDesktopMethodsIconHy, whyChooseDesktopResultsIconWrapBase, whyChooseDesktopResultsIconWrapHy, whyChooseDesktopScheduleIconWrapBase, whyChooseDesktopTeachersIconWrapBase, whyChooseDesktopTeachersIconWrapHy, whyChooseDesktopTitleBase, whyChooseDesktopTitleHy, whyChooseMobileBodyBase, whyChooseMobileBodyHy, whyChooseMobileContentBase, whyChooseMobileContentHy, whyChooseMobileFourthContentHy, whyChooseMobileIconBase, whyChooseMobileIconHy, whyChooseMobileTitleBase, whyChooseMobileTitleHy } from '../landingStyles';
import type { LandingSectionProps } from '../types';

export function LandingWhyChooseSection({ tr, isHy }: LandingSectionProps) {

  return (
    <>
      <section className="relative overflow-hidden bg-white max-tablet:-mt-px tablet:h-[764px]">
        <div className="flex flex-col gap-8 px-5 pb-10 pt-10 tablet:hidden">
          <div className="text-center">
            <h2 className="text-[28px] font-extrabold leading-[42px] tracking-[0.35px] text-[#0a0a0a]">
              {tr('Why Choose IEC?', 'Ինչու ընտրել IEC-ը')}
            </h2>
            <p className="mt-2 text-[16px] leading-[24px] tracking-[-0.45px] text-[#4a5565]">
              {tr('Experience the difference', 'Զգացեք տարբերությունը')}
            </p>
          </div>
      
          <div className="grid grid-cols-2 gap-4">
            <motion.article
              className="relative h-[220px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-4"
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
                  {tr('Modern Methods', 'Ժամանակակից մեթոդներ')}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {tr(
                    'Interactive lessons, multimedia resources, and real-world practice scenarios',
                    'Ինտերակտիվ դասեր, մուլտիմեդիա ռեսուրսներ և իրական կիրառական վարժություններ',
                  )}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative h-[220px] overflow-hidden rounded-[24px] bg-[#ffd2d2] px-4"
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
                  {tr('Proven Results', 'Ապացուցված արդյունքներ')}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {tr(
                    '98% of our students achieve their language goals and pass international exams',
                    'Մեր ուսանողների 98%-ը հասնում է իր լեզվական նպատակներին և հանձնում միջազգային քննություններ',
                  )}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative h-[220px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dff2fe] px-4"
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
                  {tr('Expert Teachers', 'Փորձառու ուսուցիչներ')}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {tr(
                    'Certified instructors with 10+ years of experience and native-level proficiency',
                    'Հավաստագրված դասավանդողներ՝ 10+ տարվա փորձով և բարձր լեզվական հմտություններով',
                  )}
                </p>
              </div>
            </motion.article>
      
            <motion.article
              className="relative h-[220px] overflow-hidden rounded-[24px] bg-[rgba(132,169,255,0.52)] px-4"
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
                  {tr('Flexible Schedule', 'Ճկուն գրաֆիկ')}
                </h3>
                <p className={isHy ? whyChooseMobileBodyHy : whyChooseMobileBodyBase}>
                  {tr(
                    'Morning, afternoon, and evening classes to fit your busy lifestyle',
                    'Առավոտյան, ցերեկային և երեկոյան դասեր՝ ձեր զբաղված առօրյային հարմար',
                  )}
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      
        <div className="max-tablet:hidden">
          <div className="pt-20 text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Why Choose IEC?', 'Ինչու ընտրել IEC-ը')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Experience the difference', 'Զգացեք տարբերությունը')}
            </p>
          </div>
      
          <div className="mx-auto mt-[95px] grid w-full max-w-[1216px] grid-cols-4 gap-8 px-6">
            <motion.article
              className="relative h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-[34px]"
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
                {tr('Modern Methods', 'Ժամանակակից մեթոդներ')}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                <span className={cn('block', !isHy && 'whitespace-nowrap')}>
                  {tr('Interactive lessons,', 'Ինտերակտիվ դասեր,')}
                </span>
                <span className={cn('block', !isHy && 'whitespace-nowrap')}>
                  {tr('multimedia resources, and', 'մուլտիմեդիա ռեսուրսներ և')}
                </span>
                <span className={cn('block', !isHy && 'whitespace-nowrap')}>
                  {tr('real-world practice scenarios', 'իրական կիրառական վարժություններ')}
                </span>
              </p>
            </motion.article>
      
            <motion.article
              className="relative h-[366px] overflow-hidden rounded-[24px] bg-[#ffd2d2] px-[34px]"
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
                {tr('Proven Results', 'Ապացուցված արդյունքներ')}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {tr(
                  '98% of our students achieve their language goals and pass international exams',
                  'Մեր ուսանողների 98%-ը հասնում է իր լեզվական նպատակներին և հանձնում միջազգային քննություններ',
                )}
              </p>
            </motion.article>
      
            <motion.article
              className="relative h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dff2fe] px-[34px]"
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
                {tr('Expert Teachers', 'Փորձառու ուսուցիչներ')}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {tr(
                  'Certified instructors with 10+ years of experience and native-level proficiency',
                  'Հավաստագրված դասավանդողներ՝ 10+ տարվա փորձով և բարձր լեզվական հմտություններով',
                )}
              </p>
            </motion.article>
      
            <motion.article
              className="relative h-[366px] overflow-hidden rounded-[24px] bg-[rgba(132,169,255,0.52)] px-[34px]"
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
                {tr('Flexible Schedule', 'Ճկուն գրաֆիկ')}
              </h3>
              <p className={isHy ? whyChooseDesktopBodyHy : whyChooseDesktopBodyBase}>
                {tr(
                  'Morning, afternoon, and evening classes to fit your busy lifestyle',
                  'Առավոտյան, ցերեկային և երեկոյան դասեր՝ ձեր զբաղված առօրյային հարմար',
                )}
              </p>
            </motion.article>
          </div>
        </div>
      </section>
    </>
  );
}
