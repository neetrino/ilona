'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
const REGISTER_ARROW_IMAGE = '/register-arrow.webp';
const REGISTER_SUBMIT_ICON =
  'https://www.figma.com/api/mcp/asset/ab507714-bdd0-4f49-afa6-14330021e236';
const BRANCH_CLASSROOM_IMAGE = '/branch-classroom-main.webp';
const BRANCH_SIDE_IMAGE = BRANCH_CLASSROOM_IMAGE;
const BRANCH_CENTER_IMAGE = BRANCH_CLASSROOM_IMAGE;
const BRANCH_CENTER_IMAGE_ALT = BRANCH_CLASSROOM_IMAGE;
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
const BUTTON_HOVER_CLASS =
  'transition-transform duration-200 ease-out hover:-translate-y-1';
const FAQ_ITEMS_EN = [
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
const FAQ_ITEMS_HY = [
  'Ի՞նչ տարիքային խմբերի եք դասավանդում։',
  'Որքա՞ն ժամանակ է պահանջվում մեկ մակարդակ ավարտելու համար։',
  'Ունե՞ք անվճար փորձնական դաս։',
  'Քանի՞ հոգուց են բաղկացած ձեր խմբերը։',
  'Կարո՞ղ եմ փոխել մասնաճյուղը անհրաժեշտության դեպքում։',
  'Ի՞նչ նյութեր են պետք ուսման համար։',
  'Պատրաստու՞մ եք միջազգային քննությունների։',
  'Ի՞նչ անել, եթե բաց թողնեմ դասը։',
  'Կա՞ն արդյոք զեղչեր։',
  'Ինչպե՞ս կարող եմ հետևել իմ առաջընթացին։',
] as const;
const REGISTER_BRANCH_OPTIONS = [
  { value: 'Andranik 131/8', labelEn: 'Andranik 131/8', labelHy: 'Անդրանիկի 131/8' },
  { value: 'Andranik 40', labelEn: 'Andranik 40', labelHy: 'Անդրանիկի 40' },
  { value: 'Ervand Qochar 23/2', labelEn: 'Ervand Qochar 23/2', labelHy: 'Էրվանդ Քոչարի 23/2' },
  {
    value: 'Hanrapetutyan 67/3',
    labelEn: 'Hanrapetutyan 67/3',
    labelHy: 'Հանրապետության 67/3',
  },
] as const;
const ENGLISH_LEVEL_OPTIONS = [
  { value: 'Beginner', labelEn: 'Beginner', labelHy: 'Սկսնակ' },
  { value: 'Elementary', labelEn: 'Elementary', labelHy: 'Տարրական' },
  { value: 'Intermediate', labelEn: 'Intermediate', labelHy: 'Միջին' },
  {
    value: 'Upper-Intermediate',
    labelEn: 'Upper-Intermediate',
    labelHy: 'Միջինից բարձր',
  },
  { value: 'Advanced', labelEn: 'Advanced', labelHy: 'Բարձր' },
] as const;
const BRANCH_CAROUSEL_ITEMS = [
  {
    shortLabel: 'Andranik 40',
    shortLabelHy: 'Անդրանիկի 40',
    branchName: 'Andranik Branch',
    branchNameHy: 'Անդրանիկի մասնաճյուղ',
    address: '40 Zoravar Andranik Street, Yerevan',
    addressHy: 'Զորավար Անդրանիկի 40, Երևան',
    image: BRANCH_CENTER_IMAGE,
    mapUrl: 'https://maps.google.com/?q=40+Zoravar+Andranik+Street,+Yerevan',
  },
  {
    shortLabel: 'Hanrapetutyan 67/3',
    shortLabelHy: 'Հանրապետության 67/3',
    branchName: 'Hanrapetutyan Branch',
    branchNameHy: 'Հանրապետության մասնաճյուղ',
    address: '67/3 Hanrapetutyan Street, Yerevan',
    addressHy: 'Հանրապետության 67/3, Երևան',
    image: BRANCH_CENTER_IMAGE_ALT,
    mapUrl: 'https://maps.google.com/?q=67/3+Hanrapetutyan+Street,+Yerevan',
  },
  {
    shortLabel: 'Ervand Qochar 23/2',
    shortLabelHy: 'Էրվանդ Քոչարի 23/2',
    branchName: 'Ervand Qochar Branch',
    branchNameHy: 'Էրվանդ Քոչարի մասնաճյուղ',
    address: '23/2 Ervand Qochar Street, Yerevan',
    addressHy: 'Էրվանդ Քոչարի 23/2, Երևան',
    image: BRANCH_SIDE_IMAGE,
    mapUrl: 'https://maps.google.com/?q=23/2+Ervand+Qochar+Street,+Yerevan',
  },
  {
    shortLabel: 'Z. Andranik 131/8',
    shortLabelHy: 'Անդրանիկի 131/8',
    branchName: 'Zoravar Andranik Branch',
    branchNameHy: 'Զորավար Անդրանիկի մասնաճյուղ',
    address: '131/8 Zoravar Andranik Street, Yerevan',
    addressHy: 'Զորավար Անդրանիկի 131/8',
    image: BRANCH_CENTER_IMAGE,
    mapUrl: 'https://maps.google.com/?q=131/8+Zoravar+Andranik+Street,+Yerevan',
  },
] as const;
const paytoneOne = Paytone_One({ weight: '400', subsets: ['latin'], preload: false });

export default function HomePage() {
  const locale = useLocale();
  const isHy = locale === 'hy';
  const tr = (en: string, hy: string) => (isHy ? hy : en);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const profileHref = isAuthenticated && user ? getDashboardPath(user.role) : '/login';
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [branchSlideDirection, setBranchSlideDirection] = useState(1);
  const [hasBranchInteracted, setHasBranchInteracted] = useState(false);
  const [englishLevel, setEnglishLevel] = useState<string>('');
  const [isEnglishLevelOpen, setIsEnglishLevelOpen] = useState(false);
  const [preferredBranch, setPreferredBranch] = useState<string>('');
  const englishLevelDropdownRef = useRef<HTMLDivElement | null>(null);
  const faqItems = isHy ? FAQ_ITEMS_HY : FAQ_ITEMS_EN;

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, isHydrated, user, router]);

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

  useEffect(() => {
    const storageKey = `scroll-position:${pathname}`;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const restorePosition = () => {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (!savedPosition) {
        return;
      }

      const top = Number(savedPosition);
      if (Number.isNaN(top)) {
        return;
      }

      window.scrollTo({ top, left: 0, behavior: 'auto' });
    };

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    requestAnimationFrame(restorePosition);
    window.addEventListener('beforeunload', savePosition);
    window.addEventListener('pagehide', savePosition);

    return () => {
      savePosition();
      window.removeEventListener('beforeunload', savePosition);
      window.removeEventListener('pagehide', savePosition);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname]);

  const totalCarouselItems = BRANCH_CAROUSEL_ITEMS.length;
  const getWrappedIndex = (index: number) => (index + totalCarouselItems) % totalCarouselItems;
  const activeBranch = BRANCH_CAROUSEL_ITEMS[activeBranchIndex];
  const leftBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex - 1)];
  const rightBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex + 1)];

  const goToPreviousBranch = () => {
    setHasBranchInteracted(true);
    setBranchSlideDirection(-1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev - 1));
  };

  const goToNextBranch = () => {
    setHasBranchInteracted(true);
    setBranchSlideDirection(1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev + 1));
  };
  const branchImageTransition = { duration: 0.46, ease: [0.22, 1, 0.36, 1] } as const;
  const branchImageVariants = {
    enter: (direction: number) => ({ x: direction * 42, opacity: 0, scale: 0.985 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({ x: direction * -42, opacity: 0, scale: 0.985 }),
  } as const;

  if (!isHydrated || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50/50">
      <LandingNavbar logoUrl={logoUrl} profileHref={profileHref} />

      {/* Hero Section */}
      <section id="home" className="relative h-[810px] min-h-[810px] scroll-mt-28 overflow-hidden bg-white">
        <div className="relative -top-4 mx-auto h-full w-full max-w-[1280px] overflow-hidden">
          <div
            className={cn(
              'absolute top-[227px] w-[992px] text-[#093394]',
              isHy ? 'left-[33px]' : 'left-[36px]',
            )}
          >
            <h1
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
            </h1>
          </div>

          <p className="absolute left-[36px] top-[470px] w-[486px] text-[16px] font-normal leading-[24px] tracking-[0.0703px] text-black/50">
            {tr(
              'Expert teachers, modern methods, and proven results. Your journey to fluency starts here.',
              'Փորձառու ուսուցիչներ, ժամանակակից մեթոդներ և իրական արդյունքներ։ Ձեր անգլերենի ճանապարհը սկսվում է այստեղ։',
            )}
          </p>

          <Link
            href="/login"
            className={cn(
              'absolute left-[36px] top-[586px] inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-[16777200px] bg-white text-[16px] font-semibold tracking-[-0.3125px] text-[#1447e6] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('Register Now', 'Գրանցվել հիմա')}
          </Link>
          <Link
            href="#branches"
            className={cn(
              'absolute left-[237px] top-[586px] inline-flex h-[60px] w-[199.055px] items-center justify-center rounded-[16777200px] border-2 border-[#1447e6] bg-[rgba(255,255,255,0.1)] text-[16px] font-normal tracking-[-0.3125px] text-[#1548e6]',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('Choose Branch', 'Ընտրել մասնաճյուղ')}
          </Link>

          <div className="absolute left-[990px] top-[158px] h-[290px] w-[290px] overflow-hidden rounded-full">
            <Image
              src={HERO_UK_BADGE_IMAGE}
              alt="UK flag badge"
              fill
              unoptimized
              priority
              loading="eager"
              fetchPriority="high"
              sizes="290px"
              className="object-cover object-[90%_center]"
            />
          </div>
          <div className="absolute left-[654px] top-[454px] h-[281px] w-[281px] overflow-hidden rounded-full">
            <Image
              src={HERO_US_BADGE_IMAGE}
              alt="US flag badge"
              fill
              unoptimized
              priority
              loading="eager"
              fetchPriority="high"
              sizes="281px"
              className="object-cover object-[20%_center]"
            />
          </div>
          <div className="absolute left-[789px] top-[140px] z-20 h-[873px] w-[393px]">
            <Image
              src={HERO_PERSON_IMAGE}
              alt="Hero student illustration"
              fill
              unoptimized
              priority
              loading="eager"
              fetchPriority="high"
              sizes="393px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* About Section (Figma 1:834) */}
      <section id="about" className="relative -mt-[16px] h-[666px] scroll-mt-28 overflow-hidden bg-[#dde7ff]">
        <div className="relative mx-auto h-full w-[1490px]">
          <div className="absolute left-[159px] top-[80px] h-[506px] w-[1152px]">
            <div className="absolute left-[608px] top-0 h-[506px] w-[544px]">
              <div className="inline-flex h-[36px] items-center rounded-full bg-white px-4">
                <span className="text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#0025db]">
                  {tr('About IEC', 'IEC-ի մասին')}
                </span>
              </div>
              <h2 className="mt-[24px] text-[48px] font-extrabold leading-[60px] tracking-[0.3516px] text-[#0a0a0a]">
                {tr('Ilona English Centre', 'Ilona English Centre')}
              </h2>
              <p className="mt-[24px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                {tr(
                  'We empower students through exceptional English education. Our mission: provide world-class instruction that opens doors to global opportunities.',
                  'Մենք զարգացնում ենք ուսանողներին բարձրակարգ անգլերենի ուսուցմամբ։ Մեր առաքելությունն է ապահովել համաշխարհային մակարդակի կրթություն, որը բացում է նոր հնարավորություններ։',
                )}
              </p>
              <p className="mt-[24px] w-[544px] text-[18px] leading-[29.25px] tracking-[-0.4395px] text-[#4a5565]">
                {tr(
                  'A supportive, engaging environment where every student thrives with modern methods and real results.',
                  'Աջակցող և ներգրավող միջավայր, որտեղ յուրաքանչյուր ուսանող առաջադիմում է ժամանակակից մեթոդներով և տեսանելի արդյունքներով։',
                )}
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
            className="absolute left-[119px] top-[-59px] h-[985px] w-[535px]"
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
            className="absolute left-[296px] top-[244px] h-[660px] w-[530px]"
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
            className="absolute left-[520px] top-[286px]"
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

      {/* Why Choose IEC Section (Figma 1:873/1:882) */}
      <section className="relative h-[764px] overflow-hidden bg-white">
        <div className="pt-20 text-center">
          <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
            {tr('Why Choose IEC?', 'Ինչու ընտրել IEC-ը')}
          </h2>
          <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
            {tr('Experience the difference', 'Զգացեք տարբերությունը')}
          </p>
        </div>

        <div className="mx-auto mt-[95px] grid w-[1216px] grid-cols-4 gap-8">
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
              className="absolute -left-[21px] -top-[28px]"
            />
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              {tr('Modern Methods', 'Ժամանակակից մեթոդներ')}
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              <span className="block whitespace-nowrap">
                {tr('Interactive lessons,', 'Ինտերակտիվ դասեր,')}
              </span>
              <span className="block whitespace-nowrap">
                {tr('multimedia resources, and', 'մուլտիմեդիա ռեսուրսներ և')}
              </span>
              <span className="block whitespace-nowrap">
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
            <div className="absolute -left-[58px] -top-[74px] h-[304px] w-[294px] rotate-[55.41deg]">
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
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              {tr('Proven Results', 'Ապացուցված արդյունքներ')}
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
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
            <div className="absolute -left-[36px] -top-[68px] h-[268px] w-[266px] rotate-[39.8deg]">
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
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              {tr('Expert Teachers', 'Փորձառու ուսուցիչներ')}
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
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
            <div className="absolute -left-[35px] -top-[58px] h-[304px] w-[244px] rotate-180 scale-y-[-1]">
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
            <h3 className="pt-[214px] text-[20px] font-medium leading-[28px] tracking-[-0.4492px] text-[#101828]">
              {tr('Flexible Schedule', 'Ճկուն գրաֆիկ')}
            </h3>
            <p className="mt-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
              {tr(
                'Morning, afternoon, and evening classes to fit your busy lifestyle',
                'Առավոտյան, ցերեկային և երեկոյան դասեր՝ ձեր զբաղված առօրյային հարմար',
              )}
            </p>
          </motion.article>
        </div>
      </section>

      {/* Student Success Section (Figma 1:381) */}
      <section className="bg-[#f9fafb] pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-[1216px] flex-col items-center gap-[50px]">
          <div className="flex w-full flex-col items-center gap-4">
            <h2 className="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Student Success', 'Ուսանողների հաջողություններ')}
            </h2>
            <p className="text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Real stories, real results', 'Իրական պատմություններ, իրական արդյունքներ')}
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
                    {tr('Maria&apos;s IELTS Success', 'Մարիայի IELTS հաջողությունը')}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[20px] tracking-[-0.1504px] text-[#4a5565]">
                    {tr('From beginner to IELTS 7.5 in 12 months', 'Սկսնակից մինչև IELTS 7.5՝ 12 ամսում')}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="#contact"
            className={cn(
              'inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#093394] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('More', 'Ավելին')}
          </Link>
        </div>
      </section>

      {/* Student Success Programs (Figma 1:797) */}
      <section className="bg-[#f9fafb] pb-8 pt-14">
        <div className="mx-auto flex w-[1482px] flex-col items-center gap-[69px] py-2">
          <h2 className="text-center text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
            {tr('Student Success', 'Ուսանողների հաջողություններ')}
          </h2>

          <div className="flex h-[397px] items-center gap-5">
            {[1, 2, 3, 4].map((item, index) => (
              <motion.article
                key={item}
                className="relative h-[390px] w-[300px] rounded-[26px] bg-[#093394]"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.35 }}
              >
                <p className="absolute left-[30px] top-[28px] text-[70px] font-bold leading-[78px] text-white">
                  {item.toString().padStart(2, '0')}
                </p>
                <p className="absolute left-[30px] top-[143px] text-[23px] font-bold leading-[26px] text-white">
                  {tr('Program Name', 'Ծրագրի անվանում')}
                </p>
                <p className="absolute left-[30px] top-[184px] text-[14px] leading-[22px] text-white">
                  {tr('Program details', 'Ծրագրի մանրամասներ')}
                </p>
                <p className="absolute left-[30px] top-[256px] text-[23px] font-bold leading-[26px] text-white">
                  18000 AMD
                  {isHy ? (
                    <span className="text-white/60">
                      <span className="text-[23px]">/</span>
                      <span className="text-[16px]">ամսական</span>
                    </span>
                  ) : (
                    <span className="text-[23px] text-white/60">/MO</span>
                  )}
                </p>
                <Link
                  href="/login"
                  className={cn(
                    'absolute left-[26px] top-[308px] inline-flex h-[56px] w-[187px] items-center justify-center gap-1 rounded-[999px] bg-white text-[16px] font-semibold leading-[24px] text-[#093394]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  <span>{tr('Register', 'Գրանցվել')}</span>
                  <Image
                    src={REGISTER_ARROW_IMAGE}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 object-contain"
                  />
                </Link>
              </motion.article>
            ))}
          </div>

          <button
            type="button"
            className={cn(
              'inline-flex h-[56px] w-[180.633px] items-center justify-center rounded-full bg-[#e7000b] text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] text-white',
              BUTTON_HOVER_CLASS,
            )}
          >
            {tr('More', 'Ավելին')}
          </button>
        </div>
      </section>

      {/* Register Now Section (Figma 1:416) */}
      <section className="bg-[#dde7ff] pb-20 pt-20">
        <div className="mx-auto flex w-[720px] flex-col items-center gap-12">
          <div className="text-center">
            <div className="inline-flex h-[36px] items-center rounded-full bg-[#093394] px-6">
              <span className="text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-white">
                {tr('Start Today', 'Սկսիր այսօր')}
              </span>
            </div>
            <h2 className="mt-4 text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Register Now', 'Գրանցվել հիմա')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Begin your English journey', 'Սկսիր քո անգլերենի ճանապարհը')}
            </p>
          </div>

          <div className="w-full rounded-[40px] bg-white px-8 pb-8 pt-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  {tr('First Name', 'Անուն')}
                </p>
                <input
                  type="text"
                  name="firstName"
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  {tr('Last Name', 'Ազգանուն')}
                </p>
                <input
                  type="text"
                  name="lastName"
                  className="h-[60px] w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 text-[16px] leading-[24px] tracking-[-0.3125px] text-[#0a0a0a] outline-none transition-colors focus:border-[#093394]"
                />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                  {tr('Age', 'Տարիք')}
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
                  {tr('Phone', 'Հեռախոս')}
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
                {tr('English Level', 'Անգլերենի մակարդակ')}
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
                    {englishLevel ||
                      tr('Select level', 'Ընտրել մակարդակը')}
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
                    {ENGLISH_LEVEL_OPTIONS.map((levelOption) => {
                      const isSelected = englishLevel === levelOption.value;

                      return (
                        <button
                          key={levelOption.value}
                          type="button"
                          onClick={() => {
                            setEnglishLevel(levelOption.value);
                            setIsEnglishLevelOpen(false);
                          }}
                          className={cn(
                            'flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[15px] leading-[22px] transition-colors',
                            isSelected
                              ? 'bg-[#edf3ff] font-semibold text-[#093394]'
                              : 'text-[#111827] hover:bg-[#f4f7ff]',
                          )}
                        >
                          {isHy ? levelOption.labelHy : levelOption.labelEn}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[14px] font-bold leading-[20px] tracking-[-0.1504px] text-[#364153]">
                {tr('Preferred Branch', 'Նախընտրելի մասնաճյուղ')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {REGISTER_BRANCH_OPTIONS.map((branchOption) => {
                  const isSelected = preferredBranch === branchOption.value;

                  return (
                    <button
                      key={branchOption.value}
                      type="button"
                      onClick={() => setPreferredBranch(branchOption.value)}
                      className={cn(
                        'h-[56px] rounded-[16px] border-2 px-4 text-left text-[16px] font-semibold leading-[24px] tracking-[-0.3125px] transition-colors',
                        isSelected
                          ? 'border-[#093394] bg-white text-[#093394]'
                          : 'border-[#e5e7eb] bg-[#f9fafb] text-[#0a0a0a]',
                      )}
                    >
                      {isHy ? branchOption.labelHy : branchOption.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className={cn(
                'mt-6 flex h-[68px] w-full items-center justify-center gap-2 rounded-[56px] bg-[#093394] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              <span>{tr('Submit Registration', 'Ուղարկել գրանցումը')}</span>
              <Image src={REGISTER_SUBMIT_ICON} alt="" width={20} height={20} unoptimized />
            </button>
          </div>
        </div>
      </section>

      {/* Our Branches Section (Figma 1:690) */}
      <section id="branches" className="relative h-[878px] overflow-hidden bg-[#093394]">
        <div className="relative mx-auto h-full w-full max-w-[1470px]">
          <div className="absolute left-1/2 top-[81px] w-[1216px] -translate-x-1/2 text-center">
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
            aria-label="Previous branch"
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
            aria-label="Next branch"
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

      {/* Follow Us Section (Figma 1:473) */}
      <section className="bg-white pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-[64px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Follow Us', 'Հետևեք մեզ')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Join the community', 'Միացեք համայնքին')}
            </p>
          </div>

          <div className="grid grid-cols-[repeat(3,minmax(0,360px))] justify-center gap-8">
            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ad46ff] to-[#f6339a]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_INSTAGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Instagram', 'Instagram')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Daily tips & stories', 'Օրական խորհուրդներ և պատմություններ')}
                </p>
                <button
                  type="button"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[156px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#e60076]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  @ilonaenglish
                </button>
              </div>
            </motion.article>

            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-[#0058df]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_FACEBOOK_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Facebook', 'Facebook')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Events & news', 'Իրադարձություններ և նորություններ')}
                </p>
                <button
                  type="button"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[146px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  Ilona English
                </button>
              </div>
            </motion.article>

            <motion.article
              className="h-[308px] overflow-hidden rounded-[40px] bg-[#3ac2fd]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="flex h-full flex-col items-center pt-10">
                <Image src={FOLLOW_TELEGRAM_ICON} alt="" width={64} height={64} unoptimized />
                <h3 className="mt-6 text-[24px] font-bold leading-[32px] text-white">
                  {tr('Telegram', 'Telegram')}
                </h3>
                <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.3125px] text-white/90">
                  {tr('Resources', 'Ռեսուրսներ')}
                </p>
                <button
                  type="button"
                  className={cn(
                    'mt-6 inline-flex h-[56px] w-[167px] items-center justify-center rounded-full bg-white text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#27abe4]',
                    BUTTON_HOVER_CLASS,
                  )}
                >
                  t.me/iecenglish
                </button>
              </div>
            </motion.article>
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
            {tr('Get in Touch', 'Կապ մեզ հետ')}
          </h2>
          <p className="mt-6 text-[24px] leading-[32px] tracking-[0.0703px] text-[rgba(27,59,163,0.4)]">
            {tr("We're here to help!", 'Մենք այստեղ ենք՝ օգնելու համար։')}
          </p>

          <div className="mt-12 flex items-center justify-center gap-6">
            <Link
              href="tel:+1234567890"
              className={cn(
                'inline-flex h-[56px] w-[271px] items-center justify-center gap-3 rounded-full bg-[#1b3ba4] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              <Image src={GET_TOUCH_PHONE_ICON} alt="" width={24} height={24} unoptimized />
              <span>+1 (234) 567-890</span>
            </Link>
            <Link
              href="mailto:info@iec.com"
              className={cn(
                'inline-flex h-[56px] w-[237px] items-center justify-center gap-3 rounded-full border-2 border-[rgba(27,59,164,0.6)] bg-[rgba(255,255,255,0.1)] text-[18px] font-bold leading-[28px] tracking-[-0.4395px] text-[#1b3ba4]',
                BUTTON_HOVER_CLASS,
              )}
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
            {tr('Join Our Team', 'Միացիր մեր թիմին')}
          </h2>
          <p className="mx-auto mt-[36px] max-w-[672px] text-center text-[20px] leading-[28px] tracking-[-0.4492px] text-[#dbeafe]">
            {tr(
              "Are you a passionate English teacher? We're always looking for talented educators to join the IEC family and make a difference in students' lives.",
              'Եթե սիրով եք դասավանդում անգլերեն, մենք միշտ փնտրում ենք տաղանդավոր մասնագետների՝ IEC թիմին միանալու և ուսանողների կյանքում փոփոխություն բերելու համար։',
            )}
          </p>

          <div className="mt-[72px] grid grid-cols-3 gap-6">
            {[
              {
                title: tr('English Teacher', 'Անգլերենի ուսուցիչ'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
              {
                title: tr('IELTS Instructor', 'IELTS դասավանդող'),
                subtitle: tr('Part-time available', 'Մասնական դրույք հասանելի է'),
              },
              {
                title: tr('Academic Manager', 'Ակադեմիական մենեջեր'),
                subtitle: tr('Full-time position', 'Լրիվ դրույք'),
              },
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
              {tr('What We Offer', 'Ինչ ենք առաջարկում')}
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: tr('Competitive salary', 'Մրցունակ աշխատավարձ') },
                { label: tr('Professional development', 'Մասնագիտական զարգացում'), shiftLeft: true },
                { label: tr('Friendly team environment', 'Բարեհամբույր թիմային միջավայր') },
                { label: tr('Modern teaching resources', 'Ժամանակակից դասավանդման ռեսուրսներ'), shiftLeft: true },
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
            <span>{tr('Send Your CV', 'Ուղարկել CV')}</span>
          </Link>
        </div>
      </section>

      {/* Latest News Section (Figma 1:513) */}
      <section className="bg-[#f9fafb] px-[159px] pb-[80px] pt-[80px]">
        <div className="mx-auto flex w-[1152px] flex-col gap-[64px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold leading-[48px] tracking-[0.3516px] text-[#0a0a0a]">
              {tr('Latest News', 'Վերջին նորություններ')}
            </h2>
            <p className="mt-4 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Updates & events', 'Թարմացումներ և միջոցառումներ')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                image: NEWS_IMAGE_1,
                overlay: NEWS_IMAGE_1_OVERLAY,
                date: tr('Apr 28, 2026', '28 Ապր, 2026'),
                dateColor: 'text-[#1447e6]',
                title: tr('Summer Intensive', 'Ամառային ինտենսիվ'),
              },
              {
                image: NEWS_IMAGE_2,
                overlay: NEWS_IMAGE_2_OVERLAY,
                date: tr('Apr 15, 2026', '15 Ապր, 2026'),
                dateColor: 'text-[#008236]',
                title: tr('Achievement Awards', 'Հաջողության մրցանակաբաշխություն'),
              },
              {
                image: NEWS_IMAGE_3,
                overlay: NEWS_IMAGE_3_OVERLAY,
                date: tr('Apr 1, 2026', '1 Ապր, 2026'),
                dateColor: 'text-[#8200db]',
                title: tr('New East Branch', 'Նոր արևելյան մասնաճյուղ'),
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
                    loading="lazy"
                    sizes="(max-width: 1200px) 100vw, 384px"
                    className={article.imageClassName ?? 'object-cover'}
                  />
                  <Image
                    src={article.overlay}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 1200px) 100vw, 384px"
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
                    {tr('Read more about this...', 'Կարդալ ավելին...')}
                  </p>
                  <Link
                    href="#"
                    className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold leading-[24px] tracking-[-0.3125px] text-[#155dfc]"
                  >
                    <span>{tr('Read more', 'Կարդալ ավելին')}</span>
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
              {tr('Frequently Asked Questions', 'Հաճախ տրվող հարցեր')}
            </h2>
            <p className="mt-2 text-[20px] leading-[28px] tracking-[-0.4492px] text-[#4a5565]">
              {tr('Everything you need to know', 'Ամեն ինչ, ինչ պետք է իմանալ')}
            </p>
          </div>

          <div className="mt-16 flex w-full flex-col gap-4">
            {faqItems.map((question) => (
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
              {tr('Still have questions?', 'Դեռ հարցե՞ր ունեք')}
            </p>
            <Link
              href="#contact"
              className={cn(
                'mt-[14px] inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#fb2c36] to-[#e7000b] px-[30px] text-[16px] font-normal leading-6 tracking-[-0.3125px] text-white',
                BUTTON_HOVER_CLASS,
              )}
            >
              {tr('Contact Us', 'Կապ մեզ հետ')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section (Figma 1:569) */}
      <footer className="relative overflow-hidden bg-black px-3 pb-[31px] pt-[67px] text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full w-[1470px]">
          <div className="absolute left-1/2 top-[48px] h-[400px] w-[502px] -translate-x-1/2">
            <div className="absolute left-0 top-0 h-[400px] w-[400px] overflow-hidden">
              <Image
                src={FOOTER_FLAG_USA}
                alt=""
                fill
                unoptimized
                loading="lazy"
                sizes="400px"
                className="object-cover"
              />
            </div>

            <div className="absolute left-[102px] top-0 h-[400px] w-[400px] overflow-hidden">
              <Image
                src={FOOTER_FLAG_UK}
                alt=""
                fill
                unoptimized
                loading="lazy"
                sizes="400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-start justify-between">
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
              <span className="text-[26px] font-bold leading-[18px] tracking-[-0.18px]">
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
                <Image
                  key={index}
                  src={icon}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  style={
                    index >= 1 && index <= 3
                      ? { transform: `translateX(${index * 20}px)` }
                      : undefined
                  }
                />
              ))}
            </div>

            <div className="mt-[18px] h-px w-[296px] bg-white/60" />

            <div
              className={cn(
                'mt-6 text-[14px] leading-[21px]',
                isHy ? 'flex flex-col items-start gap-1' : 'flex items-center gap-4',
              )}
            >
              <Link href="#" className="hover:text-white/80">
                {tr('Privacy Policy', 'Գաղտնիության քաղաքականություն')}
              </Link>
              <Link href="#" className="hover:text-white/80">
                {tr('Terms of Use', 'Օգտագործման պայմաններ')}
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

          <div className="ml-auto grid w-full max-w-[560px] grid-cols-2 items-start pt-[2px] sm:translate-x-20">
            <div className="w-[203px] sm:translate-x-[100px]">
              <h3 className="text-[18px] font-bold leading-[normal]">{tr('Branches', 'Մասնաճյուղեր')}</h3>
              <ul className="mt-[29px] space-y-2 text-[15px] leading-[23px]">
                <li>{tr('Andranik 131/8', 'Անդրանիկի 131/8')}</li>
                <li>{tr('Andranik 40', 'Անդրանիկի 40')}</li>
                <li className="whitespace-nowrap">{tr('Ervand Qochar 23/2', 'Էրվանդ Քոչարի 23/2')}</li>
                <li className="whitespace-nowrap">{tr('Hanrapetutyan 67/3', 'Հանրապետության 67/3')}</li>
              </ul>
            </div>

            <div className="w-[203px] justify-self-end">
              <h3 className="text-[18px] font-bold leading-[normal]">{tr('Navigation', 'Նավիգացիա')}</h3>
              <ul className="mt-[29px] space-y-2 text-[14px] leading-[normal]">
                <li>
                  <Link href="#about" className="hover:text-white/80">
                    {tr('About Us', 'Մեր մասին')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    {tr('Careers', 'Աշխատանք')}
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white/80">
                    {tr('FAQs', 'ՀՏՀ')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white/80">
                    {tr('Teams', 'Թիմ')}
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-white/80">
                    {tr('Contact Us', 'Կապ մեզ հետ')}
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
