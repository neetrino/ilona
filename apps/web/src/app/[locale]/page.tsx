'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Paytone_One } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';

const HERO_PERSON_IMAGE =
  'https://www.figma.com/api/mcp/asset/5fd6d382-01d8-4f1a-a4f1-2ba71c1774a2';
const HERO_UK_BADGE_IMAGE =
  'https://www.figma.com/api/mcp/asset/aa94510f-7385-4351-913e-067860465b17';
const HERO_US_BADGE_IMAGE =
  'https://www.figma.com/api/mcp/asset/9d24568c-d6ed-4796-b842-db96b22080d6';
const ABOUT_BIG_BEN_IMAGE =
  'https://www.figma.com/api/mcp/asset/6cf13eac-ff69-43bb-9f3b-b786b941ffac';
const ABOUT_FLAG_IMAGE =
  'https://www.figma.com/api/mcp/asset/f2cb8812-ff41-42e7-b10b-eeb161a9d97d';
const ABOUT_SUCCESS_ICON =
  'https://www.figma.com/api/mcp/asset/1f121d8e-3322-41b8-83fa-7ab74bbac39d';
const ABOUT_BRANCHES_ICON =
  'https://www.figma.com/api/mcp/asset/f350a76c-62e2-42a5-b36e-3fd9fa0e4247';
const WHY_METHODS_IMAGE =
  'https://www.figma.com/api/mcp/asset/30734f00-1ad2-4fca-84ba-28c2a59ee8b0';
const WHY_RESULTS_IMAGE =
  'https://www.figma.com/api/mcp/asset/675beb3d-cba1-4581-8f7e-2087a6313bcf';
const WHY_TEACHERS_IMAGE =
  'https://www.figma.com/api/mcp/asset/1d5370e5-2c90-4db0-9454-8e0c9570cef4';
const WHY_SCHEDULE_IMAGE =
  'https://www.figma.com/api/mcp/asset/c91db2fd-de48-453f-b3a8-87d453d7c3d6';
const STUDENT_SUCCESS_IMAGE =
  'https://www.figma.com/api/mcp/asset/293ddea0-ddc0-4133-b9e0-dde8a664bbc7';
const REGISTER_ARROW_IMAGE = '/register-arrow.png';
const REGISTER_SUBMIT_ICON =
  'https://www.figma.com/api/mcp/asset/ab507714-bdd0-4f49-afa6-14330021e236';
const BRANCH_SIDE_IMAGE =
  'https://www.figma.com/api/mcp/asset/8e0cb4f6-033b-408c-8c53-aa33da3ba7d8';
const BRANCH_CENTER_IMAGE =
  'https://www.figma.com/api/mcp/asset/bc68a5df-e6db-4e5d-87ab-f8738dbeacf1';
const BRANCH_CENTER_IMAGE_ALT = '/branch-center-alt.png';
const BRANCH_PLAY_ICON =
  'https://www.figma.com/api/mcp/asset/8ff13978-8971-4997-97a8-796dc711ebe8';
const BRANCH_MAP_ICON =
  'https://www.figma.com/api/mcp/asset/b7a23b24-2836-415e-858c-e6e0b43660db';
const BRANCH_NAV_ARROW =
  'https://www.figma.com/api/mcp/asset/8a23a889-4c51-4910-9644-c8145936804b';
const FOLLOW_INSTAGRAM_ICON =
  'https://www.figma.com/api/mcp/asset/9b0da3a1-232e-4f43-ac12-72713291306c';
const FOLLOW_FACEBOOK_ICON =
  'https://www.figma.com/api/mcp/asset/a8b0b16d-24c4-4bc3-b9d4-e357f71bb33d';
const FOLLOW_TELEGRAM_ICON =
  'https://www.figma.com/api/mcp/asset/df3e1455-4e30-449f-8a08-d6a3a46b4073';
const GET_TOUCH_PHONE_ICON =
  'https://www.figma.com/api/mcp/asset/278372c9-77c7-4541-af68-f01f076cf709';
const GET_TOUCH_EMAIL_ICON =
  'https://www.figma.com/api/mcp/asset/c5e057ac-529d-4b20-8de9-1effe7915001';
const TEAM_CHECK_ICON =
  'https://www.figma.com/api/mcp/asset/15391d53-dafa-4e3d-b637-db8201b07423';
const TEAM_SEND_CV_ICON =
  'https://www.figma.com/api/mcp/asset/08948765-b53f-43eb-acbb-cb37ee6f5b57';
const NEWS_IMAGE_1 =
  'https://www.figma.com/api/mcp/asset/6118a541-485d-49f9-927b-49a8118a4447';
const NEWS_IMAGE_1_OVERLAY =
  'https://www.figma.com/api/mcp/asset/553ec347-aff6-4a69-a1a6-efa9c4bf6519';
const NEWS_IMAGE_2 =
  'https://www.figma.com/api/mcp/asset/536f6c12-2a3a-4ccd-b43b-de41c6af3550';
const NEWS_IMAGE_2_OVERLAY =
  'https://www.figma.com/api/mcp/asset/6864b60b-4825-4fa8-bee1-575f87f56595';
const NEWS_IMAGE_3 =
  'https://www.figma.com/api/mcp/asset/d88a6602-049f-432f-95ac-adec54e6412d';
const NEWS_IMAGE_3_OVERLAY =
  'https://www.figma.com/api/mcp/asset/874c8cba-2392-4b4a-90b3-7d234f3b737e';
const NEWS_ARROW_ICON =
  'https://www.figma.com/api/mcp/asset/978f12e2-3890-4cf8-aad2-3362a6e4bff1';
const FAQ_DROPDOWN_ICON =
  'https://www.figma.com/api/mcp/asset/8e07c12b-716b-4275-9825-95eebcc8cdfe';
const FOOTER_LOGO_IMAGE =
  'https://www.figma.com/api/mcp/asset/c818d932-a7ee-4824-a21d-0563e4468a6a';
const FOOTER_SOCIAL_INSTAGRAM =
  'https://www.figma.com/api/mcp/asset/a8ced297-0527-41ee-8fa6-1cb38783a4d9';
const FOOTER_SOCIAL_FACEBOOK =
  'https://www.figma.com/api/mcp/asset/fa35db9d-77bf-4adc-b4be-93f0419cdae6';
const FOOTER_SOCIAL_TELEGRAM =
  'https://www.figma.com/api/mcp/asset/cc557e1a-746c-4ad0-9ccb-00cff4491385';
const FOOTER_SOCIAL_WHATSAPP =
  'https://www.figma.com/api/mcp/asset/461dfb34-60a0-4a9f-a763-55f5d92487ec';
const FOOTER_SOCIAL_VIBER =
  'https://www.figma.com/api/mcp/asset/e7606674-5c33-4d25-9cc7-9a443ab253d3';
const FOOTER_FLAG_USA =
  'https://www.figma.com/api/mcp/asset/0a309554-56bd-43a8-bb6d-b0b5171154fc';
const FOOTER_FLAG_UK =
  'https://www.figma.com/api/mcp/asset/996e4906-4cd0-4671-b738-8921a6ee19b2';
const FAQ_ITEMS = [
  'What age groups do you teach?',
  'How long does it take to complete a level?',
  'Do you offer a free trial lesson?',
  'What are your class sizes?',
  'Can I switch branches if needed?',
  'What materials do I need?',
  'Do you prepare students for international exams?',
  'What if I miss a class?',
  'Are there any discounts available?',
  'How can I track my progress?',
] as const;
const REGISTER_BRANCH_OPTIONS = [
  'Andranik 131/8',
  'Andranik 40',
  'Ervand Qochar 23/2',
  'Hanrapetutyan 67/3',
] as const;
const ENGLISH_LEVEL_OPTIONS = [
  'Beginner',
  'Elementary',
  'Intermediate',
  'Upper-Intermediate',
  'Advanced',
] as const;
const BRANCH_CAROUSEL_ITEMS = [
  {
    shortLabel: 'Andranik 40',
    branchName: 'Andranik Branch',
    address: '40 Zoravar Andranik Street, Yerevan',
    image: BRANCH_CENTER_IMAGE,
  },
  {
    shortLabel: 'Hanrapetutyan 67/3',
    branchName: 'Hanrapetutyan 67/3',
    address: 'Hanrapetutyan 67/3',
    image: BRANCH_CENTER_IMAGE_ALT,
  },
  {
    shortLabel: 'Yervanq Qochar 23/2',
    branchName: 'Yervanq Qochar 23/2',
    address: 'Yervanq Qochar 23/2',
    image: BRANCH_SIDE_IMAGE,
  },
  {
    shortLabel: 'Z. Andranik 131/8',
    branchName: 'Z. Andranik 131/8',
    address: 'Zoravar Adranik 131/8',
    image: BRANCH_CENTER_IMAGE,
  },
] as const;
const paytoneOne = Paytone_One({ weight: '400', subsets: ['latin'], preload: false });

export default function HomePage() {
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.png';
  const profileHref = isAuthenticated && user ? `/${locale}${getDashboardPath(user.role)}` : `/${locale}/login`;
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [branchSlideDirection, setBranchSlideDirection] = useState(1);
  const [englishLevel, setEnglishLevel] = useState<(typeof ENGLISH_LEVEL_OPTIONS)[number] | ''>('');
  const [isEnglishLevelOpen, setIsEnglishLevelOpen] = useState(false);
  const [preferredBranch, setPreferredBranch] = useState<(typeof REGISTER_BRANCH_OPTIONS)[number] | ''>('');
  const englishLevelDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(`/${locale}${dashboardPath}`);
    }
  }, [isAuthenticated, isHydrated, user, locale, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        englishLevelDropdownRef.current &&
        !englishLevelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEnglishLevelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const totalCarouselItems = BRANCH_CAROUSEL_ITEMS.length;
  const getWrappedIndex = (index: number) => (index + totalCarouselItems) % totalCarouselItems;
  const activeBranch = BRANCH_CAROUSEL_ITEMS[activeBranchIndex];
  const leftBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex - 1)];
  const rightBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex + 1)];

  const goToPreviousBranch = () => {
    setBranchSlideDirection(-1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev - 1));
  };

  const goToNextBranch = () => {
    setBranchSlideDirection(1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev + 1));
  };

  if (!isHydrated || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <LandingNavbar logoUrl={logoUrl} profileHref={profileHref} />

      {/* Hero Section */}
      <section id="home" className="relative h-[810px] min-h-[810px] scroll-mt-28 overflow-hidden bg-white">
        <div className="relative -top-4 mx-auto h-full w-full max-w-[1280px] overflow-hidden">
          <div className="absolute left-[36px] top-[227px] w-[992px] text-[#093394]">
            <h1
              className={cn(
                paytoneOne.className,
                'text-[5.75rem] not-italic font-normal leading-[6.375rem] tracking-[0.00769rem]',
              )}
            >
              Learn English
              <br />
              with Confidence
            </h1>
          </div>

          <p className="absolute left-[36px] top-[470px] w-[486px] text-[16px] font-normal leading-[24px] tracking-[0.0703px] text-black/50">
            Expert teachers, modern methods, and proven results. Your journey to fluency starts
            here.
          </p>

          <Link
            href={`/${locale}/login`}
            className="absolute left-[36px] top-[586px] inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-[16777200px] bg-white text-[16px] font-semibold tracking-[-0.3125px] text-[#1447e6] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
          >
            Register Now
          </Link>
          <Link
            href="#branches"
            className="absolute left-[237px] top-[586px] inline-flex h-[60px] w-[199.055px] items-center justify-center rounded-[16777200px] border-2 border-[#1447e6] bg-[rgba(255,255,255,0.1)] text-[16px] font-normal tracking-[-0.3125px] text-[#1548e6]"
          >
            Choose Branch
          </Link>

          <div className="absolute left-[990px] top-[158px] h-[290px] w-[290px] overflow-hidden rounded-full">
            <Image
              src={HERO_UK_BADGE_IMAGE}
              alt="UK flag badge"
              fill
              unoptimized
              className="object-cover object-[90%_center]"
            />
          </div>
          <div className="absolute left-[654px] top-[454px] h-[281px] w-[281px] overflow-hidden rounded-full">
            <Image
              src={HERO_US_BADGE_IMAGE}
              alt="US flag badge"
              fill
              unoptimized
              className="object-cover object-[20%_center]"
            />
          </div>
          <div className="absolute left-[789px] top-[140px] z-20 h-[873px] w-[393px]">
            <Image
              src={HERO_PERSON_IMAGE}
              alt="Hero student illustration"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* About Section (Figma 1:834) */}
      <section id="about" className="relative -mt-[16px] h-[666px] scroll-mt-28 overflow-hidden bg-[#dde7ff]">
        <div className="relative mx-auto h-full w-full max-w-[1470px]">
          <div className="absolute left-[159px] top-[80px] h-[506px] w-[1152px]">
            <div className="absolute left-[608px] top-0 h-[506px] w-[544px]">
              <div className="inline-flex h-[36px] items-center rounded-full bg-white px-4">
                <span className="text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#0025db]">
                  About IEC
                </span>
              </div>
              <h2 className="mt-[24px] text-[48px] font-extrabold leading-[60px] tracking-[0.3516px] text-[#0a0a0a]">
                Ilona English Centre
              </h2>
              <p className="mt-[24px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                We empower students through exceptional English education. Our mission: provide
                world-class instruction that opens doors to global opportunities.
              </p>
              <p className="mt-[24px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                A supportive, engaging environment where every student thrives with modern methods
                and real results.
              </p>

              <div className="mt-[24px] flex gap-6">
                <div className="h-[152px] w-[260px] rounded-[24px] bg-white px-6 pt-6">
                  <Image src={ABOUT_SUCCESS_ICON} alt="" width={32} height={32} unoptimized />
                  <p className="mt-3 text-[40px] font-bold leading-[36px] tracking-[0.3955px] text-[#0a0a0a]">
                    95%
                  </p>
                  <p className="mt-1 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    Success Rate
                  </p>
                </div>
                <div className="h-[152px] w-[260px] rounded-[24px] bg-white px-6 pt-6">
                  <Image src={ABOUT_BRANCHES_ICON} alt="" width={32} height={32} unoptimized />
                  <p className="mt-3 text-[40px] font-bold leading-[36px] tracking-[0.3955px] text-[#0a0a0a]">
                    4
                  </p>
                  <p className="mt-1 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    Branches
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute left-[100px] top-[60px] rotate-[-12deg] rounded-full bg-[#fb2c36] px-6 py-3">
              <span className="text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-white">
                Since 2011
              </span>
            </div>
          </div>

          <div className="absolute left-[119px] top-[-59px] h-[985px] w-[535px] rotate-[-168.83deg] scale-y-[-1]">
            <Image src={ABOUT_BIG_BEN_IMAGE} alt="" fill className="object-contain" unoptimized />
          </div>
          <div className="absolute left-[296px] top-[244px] h-[660px] w-[530px] rotate-[-6.86deg]">
            <Image
              src={ABOUT_FLAG_IMAGE}
              alt=""
              fill
              className="object-contain scale-[1.36] origin-center"
              unoptimized
            />
          </div>
          <div className="absolute left-[520px] top-[286px] rotate-[12deg] rounded-full bg-[#093394] px-6 py-3">
            <span className="text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-white">
              15+ Years
            </span>
          </div>
        </div>
      </section>

      {/* Why Choose IEC Section (Figma 1:873/1:882) */}
      <section className="relative h-[764px] overflow-hidden bg-white">
        <div className="pt-20 text-center">
          <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
            Why Choose IEC?
          </h2>
          <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
            Experience the difference
          </p>
        </div>

        <div className="mx-auto mt-[95px] grid w-[1216px] grid-cols-4 gap-8">
          <article className="relative h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-[34px]">
            <Image
              src={WHY_METHODS_IMAGE}
              alt=""
              width={251}
              height={251}
              unoptimized
              className="absolute -left-[21px] -top-[28px]"
            />
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              Modern Methods
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              <span className="block whitespace-nowrap">Interactive lessons,</span>
              <span className="block whitespace-nowrap">multimedia resources, and</span>
              <span className="block whitespace-nowrap">real-world practice scenarios</span>
            </p>
          </article>

          <article className="relative h-[366px] overflow-hidden rounded-[24px] bg-[#ffd2d2] px-[34px]">
            <div className="absolute -left-[58px] -top-[74px] h-[304px] w-[294px] rotate-[55.41deg]">
              <Image src={WHY_RESULTS_IMAGE} alt="" fill unoptimized className="object-contain" />
            </div>
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              Proven Results
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              98% of our students achieve their language goals and pass international exams
            </p>
          </article>

          <article className="relative h-[366px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eff6ff] to-[#dff2fe] px-[34px]">
            <div className="absolute -left-[36px] -top-[68px] h-[268px] w-[266px] rotate-[39.8deg]">
              <Image src={WHY_TEACHERS_IMAGE} alt="" fill unoptimized className="object-contain" />
            </div>
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              Expert Teachers
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              Certified instructors with 10+ years of experience and native-level proficiency
            </p>
          </article>

          <article className="relative h-[366px] overflow-hidden rounded-[24px] bg-[rgba(132,169,255,0.52)] px-[34px]">
            <div className="absolute -left-[35px] -top-[58px] h-[304px] w-[244px] rotate-180 scale-y-[-1]">
              <Image src={WHY_SCHEDULE_IMAGE} alt="" fill unoptimized className="object-contain" />
            </div>
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              Flexible Schedule
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              Morning, afternoon, and evening classes to fit your busy lifestyle
            </p>
          </article>
        </div>
      </section>

      {/* Student Success Section (Figma 1:381) */}
      <section className="bg-[#f9fafb] pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-[1216px] flex-col items-center gap-[50px]">
          <div className="flex w-full flex-col items-center gap-4">
            <h2 className="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              Student Success
            </h2>
            <p className="text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              Real stories, real results
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <article
                key={item}
                className="overflow-hidden rounded-[16px] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                <div className="relative h-[216px] w-full bg-[#101828]">
                  <Image
                    src={STUDENT_SUCCESS_IMAGE}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="px-6 pb-6 pt-5">
                  <h3 className="text-[28px] font-medium leading-[28px] tracking-[-0.4395px] text-[#101828]">
                    Maria&apos;s IELTS Success
                  </h3>
                  <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#4a5565]">
                    From beginner to IELTS 7.5 in 12 months
                  </p>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="#contact"
            className="inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#093394] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white"
          >
            More
          </Link>
        </div>
      </section>

      {/* Student Success Programs (Figma 1:797) */}
      <section className="bg-[#f9fafb] pb-8 pt-14">
        <div className="mx-auto flex w-[1482px] flex-col items-center gap-[69px] py-2">
          <h2 className="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
            Student Success
          </h2>

          <div className="flex h-[397px] items-center gap-5">
            {[1, 2, 3, 4].map((item) => (
              <article key={item} className="relative h-[390px] w-[300px] rounded-[26px] bg-[#093394]">
                <p className="absolute left-[30px] top-[28px] text-[70px] font-bold leading-[78px] text-white">
                  {item.toString().padStart(2, '0')}
                </p>
                <p className="absolute left-[30px] top-[143px] text-[23px] font-bold leading-[26px] text-white">
                  Program Name
                </p>
                <p className="absolute left-[30px] top-[184px] text-[14px] leading-[22px] text-white">
                  Program details
                </p>
                <p className="absolute left-[30px] top-[256px] text-[23px] font-bold leading-[26px] text-white">
                  18000 AMD
                  <span className="text-[23px] text-white/60">/MO</span>
                </p>
                <Link
                  href={`/${locale}/login`}
                  className="absolute left-[26px] top-[308px] inline-flex h-[56px] w-[187px] items-center justify-center gap-1 rounded-[999px] bg-white text-[16px] font-semibold leading-[24px] text-[#093394]"
                >
                  <span>Register</span>
                  <Image
                    src={REGISTER_ARROW_IMAGE}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 object-contain"
                  />
                </Link>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#e7000b] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white"
          >
            More
          </button>
        </div>
      </section>

      {/* Register Now Section (Figma 1:416) */}
      <section className="bg-[#dde7ff] pb-20 pt-20">
        <div className="mx-auto flex w-[720px] flex-col items-center gap-12">
          <div className="text-center">
            <div className="inline-flex h-[36px] items-center rounded-full bg-[#093394] px-6">
              <span className="text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-white">
                Start Today
              </span>
            </div>
            <h2 className="mt-4 text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              Register Now
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              Begin your English journey
            </p>
          </div>

          <div className="w-full rounded-[40px] bg-white px-8 pb-8 pt-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  First Name
                </p>
                <input
                  type="text"
                  name="firstName"
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  Last Name
                </p>
                <input
                  type="text"
                  name="lastName"
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  Age
                </p>
                <input
                  type="number"
                  name="age"
                  min={1}
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  Phone
                </p>
                <input
                  type="tel"
                  name="phone"
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                English Level
              </p>
              <div
                ref={englishLevelDropdownRef}
                className="relative"
                onMouseEnter={() => setIsEnglishLevelOpen(true)}
                onMouseLeave={() => setIsEnglishLevelOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsEnglishLevelOpen((prev) => !prev)}
                  className="relative h-[57px] w-full rounded-[16px] border-2 border-[#e5e7eb] bg-white pl-4 pr-14 text-left text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors hover:border-[#c5d4ff] focus:border-[#093394]"
                >
                  <span className={cn(englishLevel ? 'text-[#0a0a0a]' : 'text-[#6b7280]')}>
                    {englishLevel || 'Select level'}
                  </span>
                  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#6b7280]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={cn('transition-transform', isEnglishLevelOpen ? 'rotate-180' : '')}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {isEnglishLevelOpen ? (
                  <div className="absolute left-0 top-full z-20 w-full overflow-hidden rounded-[14px] border border-[#dbe5ff] bg-white p-1 shadow-[0px_12px_30px_rgba(9,51,148,0.12)]">
                    {ENGLISH_LEVEL_OPTIONS.map((level) => {
                      const isSelected = englishLevel === level;

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            setEnglishLevel(level);
                            setIsEnglishLevelOpen(false);
                          }}
                          className={cn(
                            'flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[15px] leading-[22px] transition-colors',
                            isSelected
                              ? 'bg-[#edf3ff] font-semibold text-[#093394]'
                              : 'text-[#111827] hover:bg-[#f4f7ff]',
                          )}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                Preferred Branch
              </p>
              <div className="grid grid-cols-2 gap-3">
                {REGISTER_BRANCH_OPTIONS.map((branch) => {
                  const isSelected = preferredBranch === branch;

                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => setPreferredBranch(branch)}
                      className={cn(
                        'h-[56px] rounded-[16px] border-2 px-4 text-left text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] transition-colors',
                        isSelected
                          ? 'border-[#093394] bg-white text-[#093394]'
                          : 'border-[#e5e7eb] bg-[#f9fafb] text-[#0a0a0a]',
                      )}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="mt-6 flex h-[68px] w-full items-center justify-center gap-2 rounded-[56px] bg-[#093394] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-white"
            >
              <span>Submit Registration</span>
              <Image src={REGISTER_SUBMIT_ICON} alt="" width={20} height={20} unoptimized />
            </button>
          </div>
        </div>
      </section>

      {/* Our Branches Section (Figma 1:690) */}
      <section className="relative h-[878px] overflow-hidden bg-[#093394]">
        <div className="absolute left-1/2 top-[81px] w-[1216px] -translate-x-1/2 text-center">
          <h2 className="text-[48px] font-medium leading-[48px] tracking-[0.3516px] text-white">
            Our Branches
          </h2>
          <p className="mt-[27px] text-[20px] leading-[28px] tracking-[-0.4492px] text-white/60">
            Find the location nearest to you
          </p>
        </div>

        <div className="absolute left-[68px] top-[313px] h-[301px] w-[553px] overflow-hidden rounded-[30px]">
          <AnimatePresence initial={false} custom={branchSlideDirection} mode="popLayout">
            <motion.div
              key={`left-image-${leftBranch.shortLabel}`}
              className="absolute inset-0"
              custom={branchSlideDirection}
              initial={{ opacity: 0, x: branchSlideDirection * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: branchSlideDirection * -24 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <Image src={leftBranch.image} alt="" fill unoptimized className="object-cover object-bottom" />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key={`left-label-${leftBranch.shortLabel}`}
            className="absolute left-[253px] top-[627px] text-[26px] font-bold leading-[27px] text-white/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {leftBranch.shortLabel}
          </motion.p>
        </AnimatePresence>

        <div className="absolute left-[869px] top-[294px] h-[301px] w-[553px] overflow-hidden rounded-[30px]">
          <AnimatePresence initial={false} custom={branchSlideDirection} mode="popLayout">
            <motion.div
              key={`right-image-${rightBranch.shortLabel}`}
              className="absolute inset-0"
              custom={branchSlideDirection}
              initial={{ opacity: 0, x: branchSlideDirection * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: branchSlideDirection * -24 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <Image src={rightBranch.image} alt="" fill unoptimized className="object-cover object-bottom" />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key={`right-label-${rightBranch.shortLabel}`}
            className="absolute left-[934px] top-[613px] text-[26px] font-bold leading-[27px] text-white/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {rightBranch.shortLabel}
          </motion.p>
        </AnimatePresence>

        <div className="absolute left-1/2 top-[251px] h-[424px] w-[722px] -translate-x-1/2 overflow-hidden rounded-[30px] border-[5px] border-white">
          <AnimatePresence initial={false} custom={branchSlideDirection} mode="popLayout">
            <motion.div
              key={`center-image-${activeBranch.shortLabel}`}
              className="absolute inset-0"
              custom={branchSlideDirection}
              initial={{ opacity: 0, x: branchSlideDirection * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: branchSlideDirection * -30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Image
                src={activeBranch.image}
                alt=""
                fill
                unoptimized
                className="object-cover object-bottom"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute left-1/2 top-[403px] flex h-[139px] w-[139px] -translate-x-1/2 items-center justify-center">
          <Image src={BRANCH_PLAY_ICON} alt="" width={139} height={139} unoptimized className="rotate-90" />
        </div>

        <button
          type="button"
          aria-label="Previous branch"
          className="absolute left-[41px] top-[444px] inline-flex h-[56px] w-[56px] items-center justify-center"
          onClick={goToPreviousBranch}
        >
          <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized />
        </button>
        <button
          type="button"
          aria-label="Next branch"
          className="absolute left-[1395px] top-[444px] inline-flex h-[56px] w-[56px] items-center justify-center"
          onClick={goToNextBranch}
        >
          <Image src={BRANCH_NAV_ARROW} alt="" width={56} height={56} unoptimized className="rotate-180" />
        </button>

        <div className="absolute left-1/2 top-[698px] w-[334px] -translate-x-1/2 text-center">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h3
              key={`active-title-${activeBranch.shortLabel}`}
              className="text-[26px] font-bold leading-[27px] text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              {activeBranch.branchName}
            </motion.h3>
          </AnimatePresence>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={`active-address-${activeBranch.shortLabel}`}
              className="mt-3 text-[16px] leading-[20px] tracking-[-0.1504px] text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              {activeBranch.address}
            </motion.p>
          </AnimatePresence>
          <div className="mt-3 inline-flex items-center gap-2">
            <Image src={BRANCH_MAP_ICON} alt="" width={16} height={16} unoptimized />
            <span className="text-[16px] leading-[20px] tracking-[-0.1504px] text-[#ff5c56]">
              View on map
            </span>
          </div>
        </div>
      </section>

      {/* Follow Us Section (Figma 1:473) */}
      <section className="bg-white pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-[64px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              Follow Us
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              Join the community
            </p>
          </div>

          <div className="grid grid-cols-[repeat(3,minmax(0,360px))] justify-center gap-8">
            <article className="h-[308px] overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ad46ff] to-[#f6339a]">
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_INSTAGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">Instagram</h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  Daily tips &amp; stories
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-[56px] w-[156px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#e60076]"
                >
                  @ilonaenglish
                </button>
              </div>
            </article>

            <article className="h-[308px] overflow-hidden rounded-[40px] bg-[#0058df]">
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_FACEBOOK_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">Facebook</h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  Events &amp; news
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-[56px] w-[146px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]"
                >
                  Ilona English
                </button>
              </div>
            </article>

            <article className="h-[308px] overflow-hidden rounded-[40px] bg-[#3ac2fd]">
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_TELEGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">Telegram</h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  Resources
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-[56px] w-[167px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#27abe4]"
                >
                  t.me/iecenglish
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Get in Touch Section (Figma 1:910/1:911) */}
      <section
        id="contact"
        className="bg-white py-20"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgb(255, 255, 255) 0.52083%, rgba(0, 0, 0, 0) 0.52083%), linear-gradient(90deg, rgb(255, 255, 255) 0.13605%, rgba(0, 0, 0, 0) 0.13605%)',
        }}
      >
        <div className="mx-auto w-full max-w-[896px] text-center">
          <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#1b3ba4]">
            Get in Touch
          </h2>
          <p className="mt-6 text-[24px] leading-[32px] tracking-[0.0703px] text-[rgba(27,59,163,0.4)]">
            We&apos;re here to help!
          </p>

          <div className="mt-12 flex items-center justify-center gap-6">
            <Link
              href="tel:+1234567890"
              className="inline-flex h-[56px] w-[271px] items-center justify-center gap-3 rounded-full bg-[#1b3ba4] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-white"
            >
              <Image src={GET_TOUCH_PHONE_ICON} alt="" width={24} height={24} unoptimized />
              <span>+1 (234) 567-890</span>
            </Link>
            <Link
              href="mailto:info@iec.com"
              className="inline-flex h-[56px] w-[237px] items-center justify-center gap-3 rounded-full border-2 border-[rgba(27,59,164,0.6)] bg-[rgba(255,255,255,0.1)] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-[#1b3ba4]"
            >
              <Image src={GET_TOUCH_EMAIL_ICON} alt="" width={24} height={24} unoptimized />
              <span>info@iec.com</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Join Our Team Section (Figma 1:722) */}
      <section
        className="px-[287px] pb-[96px] pt-[96px]"
        style={{
          backgroundImage:
            'linear-gradient(150.84621115375583deg, rgb(28, 57, 142) 0%, rgb(25, 60, 184) 100%)',
        }}
      >
        <div className="mx-auto w-[896px]">
          <h2
            className={cn(
              paytoneOne.className,
              'text-center text-[48px] leading-[48px] tracking-[0.3516px] text-white',
            )}
          >
            Join Our Team
          </h2>
          <p className="mx-auto mt-[36px] max-w-[672px] text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#dbeafe]">
            Are you a passionate English teacher? We&apos;re always looking for talented educators to
            join the IEC family and make a difference in students&apos; lives.
          </p>

          <div className="mt-[72px] grid grid-cols-3 gap-6">
            {[
              { title: 'English Teacher', subtitle: 'Full-time position' },
              { title: 'IELTS Instructor', subtitle: 'Part-time available' },
              { title: 'Academic Manager', subtitle: 'Full-time position' },
            ].map((role) => (
              <article
                key={role.title}
                className="h-[104px] rounded-[14px] bg-[rgba(255,255,255,0.1)] px-6 pt-6 text-center"
              >
                <h3 className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-white">
                  {role.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#bedbff]">
                  {role.subtitle}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[16px] bg-[rgba(255,255,255,0.1)] px-8 pb-8 pt-8">
            <h3 className="text-center text-[24px] font-medium leading-[32px] tracking-[0.0703px] text-white">
              What We Offer
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Competitive salary' },
                { label: 'Professional development', shiftLeft: true },
                { label: 'Friendly team environment' },
                { label: 'Modern teaching resources', shiftLeft: true },
              ].map((item) => (
                <div key={item.label} className={cn('flex items-center gap-3', item.shiftLeft ? 'ml-3' : '')}>
                  <Image src={TEAM_CHECK_ICON} alt="" width={24} height={24} unoptimized />
                  <span className="text-[16px] leading-[24px] tracking-[-0.3125px] text-white">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="#contact"
            className="mx-auto mt-8 flex h-[56px] w-[192px] items-center justify-center gap-2 rounded-[80px] bg-white text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-[#1c398e]"
          >
            <Image src={TEAM_SEND_CV_ICON} alt="" width={26} height={26} unoptimized />
            <span>Send Your CV</span>
          </Link>
        </div>
      </section>

      {/* Latest News Section (Figma 1:513) */}
      <section className="bg-[#f9fafb] px-[159px] pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-[1152px] flex-col gap-[64px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              Latest News
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              Updates &amp; events
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                image: NEWS_IMAGE_1,
                overlay: NEWS_IMAGE_1_OVERLAY,
                date: 'Apr 28, 2026',
                dateColor: 'text-[#1447e6]',
                title: 'Summer Intensive',
              },
              {
                image: NEWS_IMAGE_2,
                overlay: NEWS_IMAGE_2_OVERLAY,
                date: 'Apr 15, 2026',
                dateColor: 'text-[#008236]',
                title: 'Achievement Awards',
              },
              {
                image: NEWS_IMAGE_3,
                overlay: NEWS_IMAGE_3_OVERLAY,
                date: 'Apr 1, 2026',
                dateColor: 'text-[#8200db]',
                title: 'New East Branch',
                imageClassName: 'object-cover object-bottom',
              },
            ].map((article) => (
              <article
                key={article.title}
                className="h-[419.992px] overflow-hidden rounded-[32px] bg-[#ecf0f7]"
              >
                <div className="relative h-[203.992px] w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    unoptimized
                    className={article.imageClassName ?? 'object-cover'}
                  />
                  <Image
                    src={article.overlay}
                    alt=""
                    fill
                    unoptimized
                    className={article.imageClassName ?? 'object-cover'}
                  />
                </div>

                <div className="px-8 pb-8 pt-8">
                  <div className="inline-flex h-[28px] items-center rounded-full bg-white px-4">
                    <span className={cn('text-[14px] font-bold leading-[20px] tracking-[-0.1504px]', article.dateColor)}>
                      {article.date}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[24px] font-bold leading-[32px] tracking-[0.0703px] text-[#0a0a0a]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
                    Read more about this...
                  </p>
                  <Link
                    href="#"
                    className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]"
                  >
                    <span>Read more</span>
                    <Image src={NEWS_ARROW_ICON} alt="" width={16} height={16} unoptimized />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (Figma 1:605) */}
      <section id="faq" className="bg-[#ecf0f7] px-[287px] pb-[96px] pt-[96px]">
        <div className="mx-auto flex w-[896px] flex-col items-center px-8">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#101828]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              Everything you need to know
            </p>
          </div>

          <div className="mt-16 flex w-full flex-col gap-4">
            {FAQ_ITEMS.map((question) => (
              <button
                key={question}
                type="button"
                className="flex h-[84px] w-full items-center justify-between rounded-[24px] border-2 border-white bg-white px-6 text-left"
              >
                <span className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-[#101828]">
                  {question}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bedbff] shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.1)]">
                  <Image
                    src={FAQ_DROPDOWN_ICON}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="translate-y-[2px]"
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="mt-[52px] text-center">
            <p className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#364153]">
              Still have questions?
            </p>
            <Link
              href="#contact"
              className="mt-[14px] inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-[30px] text-[16px] font-normal leading-6 tracking-[-0.3125px] text-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section (Figma 1:569) */}
      <footer className="relative overflow-hidden bg-black px-[74px] pb-[31px] pt-[67px] text-white">
        <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full w-[1470px]">
          <div className="absolute left-[468px] top-[48px] h-[400px] w-[400px] overflow-hidden">
            <Image src={FOOTER_FLAG_USA} alt="" fill unoptimized className="object-cover" />
          </div>

          <div className="absolute left-[570px] top-[48px] h-[400px] w-[400px] overflow-hidden">
            <Image src={FOOTER_FLAG_UK} alt="" fill unoptimized className="object-cover" />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1364px] items-start justify-between">
          <div className="w-[465px]">
            <div className="flex items-center gap-4">
              <Image
                src={FOOTER_LOGO_IMAGE}
                alt="Ilona English Centre"
                width={52}
                height={52}
                unoptimized
                className="rounded-full"
              />
              <span className="text-[30px] font-bold leading-[18px] tracking-[-0.18px]">
                Ilona English Centre
              </span>
            </div>

            <div className="mt-[52px] flex w-[296px] items-center justify-between">
              {[
                FOOTER_SOCIAL_INSTAGRAM,
                FOOTER_SOCIAL_FACEBOOK,
                FOOTER_SOCIAL_TELEGRAM,
                FOOTER_SOCIAL_WHATSAPP,
                FOOTER_SOCIAL_VIBER,
              ].map((icon, index) => (
                <Image key={index} src={icon} alt="" width={40} height={40} unoptimized />
              ))}
            </div>

            <div className="mt-[18px] h-px w-[296px] bg-white/60" />

            <div className="mt-6 flex items-center gap-10 text-[14px] leading-[21px]">
              <Link href="#" className="hover:text-white/80">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white/80">
                Terms of Use
              </Link>
            </div>

            <p className="mt-4 text-[14px] leading-[21px] text-white">
              Copyright &copy;2026{' '}
              <Link
                href="https://neetrino.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold no-underline hover:no-underline"
              >
                Neetrino IT Company
              </Link>
              . All Rights Reserved.
            </p>
          </div>

          <div className="flex items-start gap-[71px] pt-[2px]">
            <div className="w-[141px]">
              <h3 className="text-[18px] font-bold leading-[normal]">Branches</h3>
              <ul className="mt-[29px] space-y-2 text-[15px] leading-[23px]">
                <li>Andranik 131/8</li>
                <li>Andranik 40</li>
                <li>Ervand Qochar 23/2</li>
                <li>Hanrapetutyan 67/3</li>
              </ul>
            </div>

            <div className="w-[203px]">
              <h3 className="text-[18px] font-bold leading-[normal]">Navigation</h3>
              <ul className="mt-[29px] space-y-2 text-[14px] leading-[normal]">
                <li>
                  <Link href="#about" className="hover:text-white/80">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white/80">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    Teams
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-white/80">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
