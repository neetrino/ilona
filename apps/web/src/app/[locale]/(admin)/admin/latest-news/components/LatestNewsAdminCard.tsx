'use client';

import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import type { BlogPostDto } from '@ilona/types';
import { cn } from '@/shared/lib/utils';
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
  publishedLabel: string;
  editHintLabel: string;
  removeLabel: string;
  onSelect: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
  onTogglePublished: (post: BlogPostDto, isPublished: boolean) => void;
};

function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match?.[0].trim() ?? trimmed;
}

const iconButtonClassName = cn(
  'rounded-lg p-2 transition-colors duration-150 ease-out',
  'focus:outline-none focus:ring-2 focus:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'active:scale-95',
);

export function LatestNewsAdminCard({
  post,
  isHy,
  isSelected,
  isPending,
  draftLabel,
  publishedLabel,
  editHintLabel,
  removeLabel,
  onSelect,
  onDelete,
  onTogglePublished,
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
        </div>
      </button>

      <div className="flex items-center justify-end gap-2 border-t border-[rgba(14,14,16,0.06)] px-5 py-3 tablet:px-8">
        <button
          type="button"
          aria-label={editHintLabel}
          title={editHintLabel}
          disabled={isPending}
          onClick={() => onSelect(post)}
          className={cn(
            iconButtonClassName,
            'text-slate-900 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-400',
          )}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={post.isPublished}
          aria-label={publishedLabel}
          title={publishedLabel}
          disabled={isPending}
          onClick={() => onTogglePublished(post, !post.isPublished)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-60',
            post.isPublished
              ? 'bg-[#1010a3] focus:ring-[#1010a3]/25'
              : 'bg-slate-300 focus:ring-slate-400/40',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-[2px] size-4 rounded-full bg-white shadow-sm transition-all duration-200 ease-out',
              post.isPublished
                ? 'left-[2px] translate-x-4 border border-[#1010a3]/20'
                : 'left-[2px] translate-x-0 border border-slate-400/40',
            )}
          />
        </button>

        <button
          type="button"
          aria-label={removeLabel}
          title={removeLabel}
          disabled={isPending}
          onClick={() => onDelete(post)}
          className={cn(
            iconButtonClassName,
            'text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-400/30',
            'disabled:hover:bg-transparent disabled:hover:text-red-600',
          )}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
