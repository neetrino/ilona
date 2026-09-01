'use client';

import { Archive, ArrowLeft, Newspaper, Plus } from 'lucide-react';
import type { BlogPostDto } from '@ilona/types';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { LatestNewsCardsGrid } from './LatestNewsCardsGrid';

export type LatestNewsViewMode = 'active' | 'archive';

type LatestNewsPostsSectionProps = {
  posts: BlogPostDto[];
  isLoading: boolean;
  isPending: boolean;
  isHy: boolean;
  selectedId: string | null;
  viewMode: LatestNewsViewMode;
  archiveCount: number;
  title: string;
  description: string;
  loadingLabel: string;
  emptyLabel: string;
  draftLabel: string;
  publishedLabel: string;
  editHintLabel: string;
  removeLabel: string;
  createLabel: string;
  archiveLabel: string;
  backToActiveLabel: string;
  onCreate: () => void;
  onSelect: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
  onTogglePublished: (post: BlogPostDto, isPublished: boolean) => void;
  onViewModeChange: (mode: LatestNewsViewMode) => void;
};

export function LatestNewsPostsSection({
  posts,
  isLoading,
  isPending,
  isHy,
  selectedId,
  viewMode,
  archiveCount,
  title,
  description,
  loadingLabel,
  emptyLabel,
  draftLabel,
  publishedLabel,
  editHintLabel,
  removeLabel,
  createLabel,
  archiveLabel,
  backToActiveLabel,
  onCreate,
  onSelect,
  onDelete,
  onTogglePublished,
  onViewModeChange,
}: LatestNewsPostsSectionProps) {
  const isArchive = viewMode === 'archive';

  return (
    <section className="overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white shadow-[0_12px_40px_rgba(16,16,163,0.04)]">
      <div className="border-b border-[rgba(14,14,16,0.06)] bg-gradient-to-r from-[#f5f6ff] via-white to-[#f8fafc] px-6 py-5 tablet:px-8 tablet:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl text-white',
                isArchive ? 'bg-slate-700' : 'bg-[#1010a3]',
              )}
            >
              {isArchive ? (
                <Archive className="size-5" strokeWidth={2} />
              ) : (
                <Newspaper className="size-5" strokeWidth={2} />
              )}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#3b3b40] tablet:text-xl">{title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8b8b90]">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isArchive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onViewModeChange('active')}
                disabled={isPending}
                className="inline-flex h-10 items-center gap-2 rounded-[14px] px-4"
              >
                <ArrowLeft className="size-4" strokeWidth={2.25} />
                {backToActiveLabel}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onViewModeChange('archive')}
                  disabled={isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-[14px] px-4"
                >
                  <Archive className="size-4" strokeWidth={2.25} />
                  {archiveLabel}
                  {archiveCount > 0 ? (
                    <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
                      {archiveCount}
                    </span>
                  ) : null}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onCreate}
                  disabled={isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#1010a3] px-4 text-white hover:bg-[#1010a3]/90"
                >
                  <Plus className="size-4" strokeWidth={2.25} />
                  {createLabel}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 tablet:p-8">
        {!isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(16,16,163,0.18)] bg-[#f7f8fc] px-6 py-14 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-[#1010a3] shadow-sm">
              {isArchive ? (
                <Archive className="size-7" strokeWidth={1.75} />
              ) : (
                <Newspaper className="size-7" strokeWidth={1.75} />
              )}
            </span>
            <p className="max-w-sm text-sm text-[#8b8b90]">{emptyLabel}</p>
            {!isArchive ? (
              <Button
                type="button"
                size="sm"
                onClick={onCreate}
                className="mt-5 rounded-[14px] bg-[#1010a3] px-4 text-white hover:bg-[#1010a3]/90"
              >
                {createLabel}
              </Button>
            ) : null}
          </div>
        ) : (
          <LatestNewsCardsGrid
            posts={posts}
            isLoading={isLoading}
            isPending={isPending}
            isHy={isHy}
            selectedId={selectedId}
            loadingLabel={loadingLabel}
            emptyLabel={emptyLabel}
            draftLabel={draftLabel}
            publishedLabel={publishedLabel}
            editHintLabel={editHintLabel}
            removeLabel={removeLabel}
            onSelect={onSelect}
            onDelete={onDelete}
            onTogglePublished={onTogglePublished}
          />
        )}
      </div>
    </section>
  );
}
