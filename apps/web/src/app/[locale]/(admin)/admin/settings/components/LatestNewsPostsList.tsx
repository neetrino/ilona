'use client';

import type { BlogPostDto } from '@ilona/types';
import { Button } from '@/shared/components/ui';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';

type LatestNewsPostsListProps = {
  posts: BlogPostDto[];
  isLoading: boolean;
  isPending: boolean;
  loadingLabel: string;
  emptyLabel: string;
  draftLabel: string;
  editLabel: string;
  removeLabel: string;
  onEdit: (post: BlogPostDto) => void;
  onDelete: (post: BlogPostDto) => void;
};

export function LatestNewsPostsList({
  posts,
  isLoading,
  isPending,
  loadingLabel,
  emptyLabel,
  draftLabel,
  editLabel,
  removeLabel,
  onEdit,
  onDelete,
}: LatestNewsPostsListProps) {
  if (isLoading) {
    return <p className="text-sm text-[#8b8b90]">{loadingLabel}</p>;
  }

  if (posts.length === 0) {
    return <p className="text-sm text-[#8b8b90]">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => {
        const imageSrc = getFullApiUrl(post.imageUrl);
        return (
          <li
            key={post.id}
            className="flex flex-col gap-3 rounded-2xl border border-[rgba(14,14,16,0.07)] p-4 sm:flex-row sm:items-center"
          >
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                className="h-16 w-24 shrink-0 rounded-xl object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#3b3b40]">{post.titleEn}</p>
              <p className="truncate text-sm text-[#8b8b90]">{post.titleHy}</p>
              <p className="mt-1 text-xs text-[#8b8b90]">
                {post.publishedAt.slice(0, 10)}
                {!post.isPublished ? ` · ${draftLabel}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(post)}
                disabled={isPending}
              >
                {editLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDelete(post)}
                disabled={isPending}
              >
                {removeLabel}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
