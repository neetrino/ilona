'use client';

import type { BlogPostDto } from '@ilona/types';
import { LatestNewsAdminCard } from './LatestNewsAdminCard';

type LatestNewsCardsGridProps = {
  posts: BlogPostDto[];
  isLoading: boolean;
  isPending: boolean;
  isHy: boolean;
  selectedId: string | null;
  loadingLabel: string;
  emptyLabel: string;
  draftLabel: string;
  publishedLabel: string;
  editHintLabel: string;
  removeLabel: string;
  onSelect: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
  onTogglePublished: (post: BlogPostDto, isPublished: boolean) => void;
};

export function LatestNewsCardsGrid({
  posts,
  isLoading,
  isPending,
  isHy,
  selectedId,
  loadingLabel,
  emptyLabel,
  draftLabel,
  publishedLabel,
  editHintLabel,
  removeLabel,
  onSelect,
  onDelete,
  onTogglePublished,
}: LatestNewsCardsGridProps) {
  if (isLoading) {
    return <p className="text-sm text-[#8b8b90]">{loadingLabel}</p>;
  }

  if (posts.length === 0) {
    return <p className="text-sm text-[#8b8b90]">{emptyLabel}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-8 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <LatestNewsAdminCard
            post={post}
            isHy={isHy}
            isSelected={selectedId === post.id}
            isPending={isPending}
            draftLabel={draftLabel}
            publishedLabel={publishedLabel}
            editHintLabel={editHintLabel}
            removeLabel={removeLabel}
            onSelect={onSelect}
            onDelete={onDelete}
            onTogglePublished={onTogglePublished}
          />
        </li>
      ))}
    </ul>
  );
}
