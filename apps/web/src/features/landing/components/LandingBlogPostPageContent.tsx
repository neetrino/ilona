'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';
import { useBlogPost } from '@/features/blog';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';
import { LandingCanvasScaleRuntime } from '@/shared/components/layout/LandingCanvasScaleInit';
import { CanvasScaler } from '@/shared/components/layout/CanvasScaler';
import { cn } from '@/shared/lib/utils';
import { useLandingTr } from '../hooks/useLandingTr';
import {
  formatLandingBlogDate,
  getBlogDateBadgeClasses,
  mapBlogPostToLandingView,
} from '../landingBlogContent';
import { LandingSectionPlaceholder } from './LandingSectionPlaceholder';

const LandingFooter = dynamic(
  () =>
    import('./LandingFooter').then((module) => ({
      default: module.LandingFooter,
    })),
  { loading: () => <LandingSectionPlaceholder className="min-h-[280px] bg-black" /> },
);

type LandingBlogPostPageContentProps = {
  slug: string;
};

export function LandingBlogPostPageContent({ slug }: LandingBlogPostPageContentProps) {
  const { tr, isHy } = useLandingTr();
  const { isAuthenticated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const { data: apiPost, isLoading, isError } = useBlogPost(slug);
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const profileHref = isAuthenticated && user ? getPortalEntryPath(user.role) : '/login';

  if (!isLoading && (isError || !apiPost)) {
    notFound();
  }

  const post = apiPost ? mapBlogPostToLandingView(apiPost) : null;
  const title = post ? tr(post.titleEn, post.titleHy) : '';
  const date = post ? formatLandingBlogDate(post.publishedAt, isHy) : '';
  const paragraphs = post ? (isHy ? post.bodyHy : post.bodyEn) : [];
  const dateBadge = post ? getBlogDateBadgeClasses(post.dateColor) : null;

  return (
    <>
      <LandingCanvasScaleRuntime />
      <LandingNavbar logoUrl={logoUrl} profileHref={profileHref} logoHref="/" activeSection="blog" />
      <CanvasScaler className="min-h-screen">
        <section className="min-h-[calc(100dvh-6rem)] bg-[#f9fafb] pt-28">
          <article className="mx-auto w-full max-w-[800px] px-5 pb-16 pt-4 tablet:px-6 tablet:pb-24 tablet:pt-6">
            <Link
              href="/blog"
              className="inline-flex items-center text-[14px] font-semibold leading-[21px] text-[#155dfc] transition-opacity hover:opacity-80 tablet:text-[16px]"
            >
              {tr('← Back to blog', '← Վերադառնալ բլոգ')}
            </Link>

            {isLoading || !post ? (
              <div className="mt-8 animate-pulse tablet:mt-10" aria-busy="true" aria-live="polite">
                <span className="sr-only">{tr('Loading…', 'Բեռնվում է…')}</span>
                <div className="h-[220px] w-full rounded-[28px] bg-[#e5eaf2] tablet:h-[360px] tablet:rounded-[32px]" />
                <div className="mt-6 h-7 w-28 rounded-full bg-[#e5eaf2] tablet:mt-8" />
                <div className="mt-4 space-y-3 tablet:mt-6">
                  <div className="h-9 w-[88%] rounded-lg bg-[#e5eaf2] tablet:h-11" />
                  <div className="h-9 w-[62%] rounded-lg bg-[#e5eaf2] tablet:h-11" />
                </div>
                <div className="mt-6 space-y-3 tablet:mt-8 tablet:space-y-4">
                  <div className="h-5 w-full rounded bg-[#e5eaf2]" />
                  <div className="h-5 w-full rounded bg-[#e5eaf2]" />
                  <div className="h-5 w-[94%] rounded bg-[#e5eaf2]" />
                  <div className="h-5 w-full rounded bg-[#e5eaf2]" />
                  <div className="h-5 w-[86%] rounded bg-[#e5eaf2]" />
                  <div className="h-5 w-[72%] rounded bg-[#e5eaf2]" />
                </div>
              </div>
            ) : (
              <>
                <div className="relative mt-8 h-[220px] w-full overflow-hidden rounded-[28px] tablet:mt-10 tablet:h-[360px] tablet:rounded-[32px]">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    unoptimized
                    priority
                    loading="eager"
                    fetchPriority="high"
                    sizes="(max-width: 800px) 100vw, 800px"
                    className={cn('object-cover', post.imageClassName)}
                  />
                </div>

                <div
                  className={cn(
                    'mt-6 inline-flex h-7 items-center rounded-full px-3 shadow-[0_2px_8px_rgba(16,16,163,0.08)] ring-1 tablet:mt-8 tablet:h-[28px] tablet:px-4',
                    dateBadge?.shell,
                  )}
                >
                  <span
                    className={cn(
                      'text-[12px] font-bold leading-[18px] tabular-nums tablet:text-[14px] tablet:leading-[20px]',
                      dateBadge?.text,
                    )}
                  >
                    {date}
                  </span>
                </div>

                <h1 className="mt-4 text-[28px] font-extrabold leading-[36px] tracking-[0.2px] text-[#093394] tablet:mt-6 tablet:text-[40px] tablet:leading-[48px]">
                  {title}
                </h1>

                <div className="mt-6 flex flex-col gap-4 tablet:mt-8 tablet:gap-5">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-[15px] leading-[24px] tracking-[-0.2px] text-[#4a5565] tablet:text-[18px] tablet:leading-[28px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </>
            )}
          </article>
        </section>

        <LandingFooter tr={tr} isHy={isHy} logoUrl={logoUrl} />
      </CanvasScaler>
    </>
  );
}
