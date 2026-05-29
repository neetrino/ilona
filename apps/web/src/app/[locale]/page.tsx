'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Paytone_One } from 'next/font/google';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { useCenters } from '@/features/centers';
import { MapPin, BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';

const HERO_PERSON_IMAGE =
  'https://www.figma.com/api/mcp/asset/5fd6d382-01d8-4f1a-a4f1-2ba71c1774a2';
const HERO_UK_BADGE_IMAGE =
  'https://www.figma.com/api/mcp/asset/aa94510f-7385-4351-913e-067860465b17';
const HERO_US_BADGE_IMAGE =
  'https://www.figma.com/api/mcp/asset/9d24568c-d6ed-4796-b842-db96b22080d6';
const paytoneOne = Paytone_One({ weight: '400', subsets: ['latin'], preload: false });

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.png';
  const profileHref = isAuthenticated && user ? `/${locale}${getDashboardPath(user.role)}` : `/${locale}/login`;

  // Fetch active centers from API (same as in Admin) for Our Branches section
  const { data: centersData } = useCenters({ isActive: true, take: 50 });
  const branches = (centersData?.items ?? []).map((center) => ({
    id: center.id,
    name: center.name,
    address: center.address ?? center.description ?? '',
    icon: MapPin,
  }));

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(`/${locale}${dashboardPath}`);
    }
  }, [isAuthenticated, isHydrated, user, locale, router]);

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
              className="object-cover"
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

      {/* About Section */}
      <section id="about" className="py-20 scroll-mt-28 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <AnimatedSection className="order-2 lg:order-1">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                  {t('aboutTitle')}
                </h2>
                <p className="text-slate-600 text-lg mb-4 font-medium">
                  {t('aboutSubtitle')}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t('aboutDescription')}
                </p>
              </AnimatedSection>
              <AnimatedSection className="order-1 lg:order-2" delay={0.1}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                  <Image
                    src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=85"
                    alt="Modern classroom English learning"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Branches Section - shows centers from Admin */}
      {branches.length > 0 && (
        <section id="branches" className="py-20 scroll-mt-28 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="max-w-6xl mx-auto">
              <div className="text-center mb-14 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                  {t('branchesTitle')}
                </h2>
                <p className="text-lg text-slate-600 max-w-xl mx-auto">
                  {t('branchesSubtitle')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {branches.map((branch, i) => (
                  <AnimatedSection key={branch.id} delay={i * 0.08}>
                    <motion.div
                      className="h-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                      whileHover={{ y: -4 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform duration-300">
                        <branch.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                        {branch.name}
                      </h3>
                      {branch.address ? (
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {branch.address}
                        </p>
                      ) : null}
                    </motion.div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Features / Benefits Section */}
      <section id="courses" className="py-20 scroll-mt-28 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-14 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                {t('featuresTitle')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('featuresSubtitle')}
              </p>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: Users, title: t('feature1Title'), desc: t('feature1Description'), iconBg: 'bg-blue-100/80', iconCl: 'text-blue-600' },
                { icon: BookOpen, title: t('feature2Title'), desc: t('feature2Description'), iconBg: 'bg-amber-100/80', iconCl: 'text-amber-600' },
                { icon: GraduationCap, title: t('feature3Title'), desc: t('feature3Description'), iconBg: 'bg-emerald-100/80', iconCl: 'text-emerald-600' },
                { icon: BookOpen, title: t('feature4Title'), desc: t('feature4Description'), iconBg: 'bg-purple-100/80', iconCl: 'text-purple-600' },
                { icon: GraduationCap, title: t('feature5Title'), desc: t('feature5Description'), iconBg: 'bg-indigo-100/80', iconCl: 'text-indigo-600' },
                { icon: Users, title: t('feature6Title'), desc: t('feature6Description'), iconBg: 'bg-rose-100/80', iconCl: 'text-rose-600' },
              ].map((item, i) => (
                <AnimatedSection key={item.title} delay={(i % 3) * 0.06}>
                  <motion.div
                    className="h-full bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    whileHover={{ y: -2 }}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110', item.iconBg)}>
                      <item.icon className={cn('w-6 h-6', item.iconCl)} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-[15px]">
                      {item.desc}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student Life / Learning Visuals Section */}
      <section id="teachers" className="py-20 scroll-mt-28 sm:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-12 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                {t('studentLifeTitle')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('studentLifeSubtitle')}
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10]">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=85"
                    alt="Students learning together"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10]">
                  <Image
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=85"
                    alt="English study materials and learning"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-14 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                {t('howItWorksTitle')}
              </h2>
              <p className="text-lg text-slate-600">
                {t('howItWorksSubtitle')}
              </p>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14">
              {[1, 2, 3].map((step, i) => (
                <AnimatedSection key={step} delay={i * 0.1}>
                  <motion.div
                    className="text-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-primary-foreground shadow-lg">
                      {step}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                      {t(`step${step}Title`)}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-[15px]">
                      {t(`step${step}Description`)}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-10 sm:p-14 lg:p-16 text-primary-foreground shadow-2xl relative overflow-hidden ring-2 ring-primary/20">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" aria-hidden />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 tracking-tight">
                  {t('ctaTitle')}
                </h2>
                <p className="text-lg mb-10 opacity-95 leading-relaxed max-w-xl mx-auto">
                  {t('ctaDescription')}
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="rounded-xl text-base px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] font-semibold group"
                >
                  <Link href={`/${locale}/login`}>
                    {t('signIn')}
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1 inline-block" />
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t scroll-mt-28 border-slate-200/60 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center">
            <p className="text-sm text-slate-600 text-center">
              {t('footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
