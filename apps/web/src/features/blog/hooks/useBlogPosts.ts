'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BlogPostDto } from '@ilona/types';
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminBlogPosts,
  fetchBlogPostBySlug,
  fetchPublicBlogPosts,
  updateBlogPost,
  type BlogPostWritePayload,
} from '../api/blog.api';

export const blogKeys = {
  all: ['blog-posts'] as const,
  public: () => [...blogKeys.all, 'public'] as const,
  admin: () => [...blogKeys.all, 'admin'] as const,
  detail: (slug: string) => [...blogKeys.all, 'detail', slug] as const,
};

export function usePublicBlogPosts() {
  return useQuery({
    queryKey: blogKeys.public(),
    queryFn: () => fetchPublicBlogPosts(),
  });
}

export function useBlogPost(slug: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: options?.enabled ?? Boolean(slug),
    placeholderData: () => {
      const publicPosts = queryClient.getQueryData<BlogPostDto[]>(blogKeys.public());
      return publicPosts?.find((post) => post.slug === slug);
    },
  });
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: blogKeys.admin(),
    queryFn: () => fetchAdminBlogPosts(),
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BlogPostWritePayload) => createBlogPost(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BlogPostWritePayload> }) =>
      updateBlogPost(id, payload),
    onSuccess: (post: BlogPostDto) => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.setQueryData(blogKeys.detail(post.slug), post);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}
