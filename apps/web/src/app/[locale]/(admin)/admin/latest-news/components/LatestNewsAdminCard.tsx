'use client';

import Image from 'next/image';
import type { BlogPostDto } from '@ilona/types';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { NEWS_ARROW_ICON } from '@/features/landing/landingConstants';
import {
  formatLandingBlogDate,
  mapBlogPostToLandingView,
} from '@/features/landing/landingBlogContent';

type LatestNewsAdminCardProps = {
  post: BlogPostDto;
  isHy: boolean;
  isSelected: boolean;
  isPending: boolean;
  draftLabel: string;
  editHintLabel: string;
  removeLabel: string;
  onSelect: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
};

function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match?.[0].trim() ?? trimmed;
}

export function LatestNewsAdminCard({
  post,
  isHy,
  isSelected,
  isPending,
  draftLabel,
  editHintLabel,
  removeLabel,
  onSelect,
  onDelete,
}: LatestNewsAdminCardProps) {
  const view = mapBlogPostToLandingView(post);
  const title = isHy ? view.titleHy : view.titleEn;
  const preview = getFirstSentence(isHy ? (view.bodyHy[0] ?? '') : (view.bodyEn[0] ?? ''));
  const date = formatLandingBlogDate(view.publishedAt, isHy);

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[28px] bg-[#ecf0f7] shadow-sm transition-all duration-300 tablet:min-h-[420px] tablet:rounded-[32px]',
        isSelected
          ? 'ring-2 ring-[#1010a3] ring-offset-2'
          : 'hover:-translate-y-0.5 hover:shadow-md',
        isPending && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(post)}
        disabled={isPending}
        className="group flex min-h-0 flex-1 flex-col text-left"
        aria-label={`${editHintLabel}: ${title}`}
      >
        <div className="relative h-[160px] w-full overflow-hidden tablet:h-[204px]">
          <Image
            src={view.image}
            alt=""
            fill
            unoptimized
            loading="lazy"
            sizes="(max-width: 743px) 100vw, 384px"
            className={cn(
              'transition-transform duration-700 ease-out group-hover:scale-105',
              view.imageClassName ?? 'object-cover',
            )}
          />
          {view.overlay ? (
            <Image
              src={view.overlay}
              alt=""
              fill
              unoptimized
              loading="lazy"
              sizes="(max-width: 743px) 100vw, 384px"
              className={view.imageClassName ?? 'object-cover'}
            />
          ) : null}
          {!post.isPublished ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#8b8b90]">
              {draftLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-5 pb-3 pt-5 tablet:px-8 tablet:pt-8">
          <div className="inline-flex h-7 w-fit items-center rounded-full bg-white px-3 tablet:px-4">
            <span
              className={cn(
                'text-[12px] font-bold leading-[18px] tracking-[-0.15px] tablet:text-[14px] tablet:leading-[20px]',
                view.dateColor,
              )}
            >
              {date}
            </span>
          </div>

          <h3 className="mt-4 text-[18px] font-bold leading-[27px] tracking-[0.07px] text-[#093394] tablet:text-[24px] tablet:leading-[32px]">
            {title}
          </h3>

          <p className="mt-2 line-clamp-2 text-[13px] leading-[19.5px] tracking-[-0.31px] text-[#4a5565] tablet:mt-3 tablet:text-[16px] tablet:leading-[24px]">
            {preview}
          </p>

          <div className="mt-3 flex justify-end tablet:mt-auto tablet:pt-4">
            <span className="inline-flex items-center gap-2 text-[13px] font-bold leading-[19.5px] text-[#155dfc] transition-opacity group-hover:opacity-80 tablet:text-[16px] tablet:leading-[24px]">
              <span>{editHintLabel}</span>
              <Image
                src={NEWS_ARROW_ICON}
                alt=""
                width={14}
                height={14}
                unoptimized
                className="tablet:h-4 tablet:w-4"
              />
            </span>
          </div>
        </div>
      </button>

      <div className="border-t border-[rgba(14,14,16,0.06)] px-5 py-3 tablet:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={isPending}
          onClick={() => onDelete(post)}
        >
          {removeLabel}
        </Button>
      </div>
    </article>
  );
}
