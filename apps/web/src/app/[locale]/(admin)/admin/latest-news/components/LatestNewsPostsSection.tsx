'use client';

import { Newspaper, Plus } from 'lucide-react';
import type { BlogPostDto } from '@ilona/types';
import { Button } from '@/shared/components/ui';
import { LatestNewsCardsGrid } from './LatestNewsCardsGrid';

type LatestNewsPostsSectionProps = {
  posts: BlogPostDto[];
  isLoading: boolean;
  isPending: boolean;
  isHy: boolean;
  selectedId: string | null;
  title: string;
  description: string;
  loadingLabel: string;
  emptyLabel: string;
  draftLabel: string;
  publishedLabel: string;
  editHintLabel: string;
  removeLabel: string;
  createLabel: string;
  onCreate: () => void;
  onSelect: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
  onTogglePublished: (post: BlogPostDto, isPublished: boolean) => void;
};

export function LatestNewsPostsSection({
  posts,
  isLoading,
  isPending,
  isHy,
  selectedId,
  title,
  description,
  loadingLabel,
  emptyLabel,
  draftLabel,
  publishedLabel,
  editHintLabel,
  removeLabel,
  createLabel,
  onCreate,
  onSelect,
  onDelete,
  onTogglePublished,
}: LatestNewsPostsSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white shadow-[0_12px_40px_rgba(16,16,163,0.04)]">
      <div className="border-b border-[rgba(14,14,16,0.06)] bg-gradient-to-r from-[#f5f6ff] via-white to-[#f8fafc] px-6 py-5 tablet:px-8 tablet:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#1010a3] text-white">
              <Newspaper className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#3b3b40] tablet:text-xl">{title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8b8b90]">{description}</p>
            </div>
          </div>
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
        </div>
      </div>

      <div className="p-6 tablet:p-8">
        {!isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(16,16,163,0.18)] bg-[#f7f8fc] px-6 py-14 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-[#1010a3] shadow-sm">
              <Newspaper className="size-7" strokeWidth={1.75} />
            </span>
            <p className="max-w-sm text-sm text-[#8b8b90]">{emptyLabel}</p>
            <Button
              type="button"
              size="sm"
              onClick={onCreate}
              className="mt-5 rounded-[14px] bg-[#1010a3] px-4 text-white hover:bg-[#1010a3]/90"
            >
              {createLabel}
            </Button>
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
