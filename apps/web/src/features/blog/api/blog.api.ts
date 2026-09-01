import type { BlogPostDto } from '@ilona/types';
import { api } from '@/shared/lib/api';

export type { BlogPostDto };

function appendBody(formData: FormData, key: string, paragraphs: string[]) {
  formData.append(key, JSON.stringify(paragraphs));
}

export async function fetchPublicBlogPosts(): Promise<BlogPostDto[]> {
  return api.get<BlogPostDto[]>('/blog-posts');
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDto> {
  return api.get<BlogPostDto>(`/blog-posts/${encodeURIComponent(slug)}`);
}

export async function fetchAdminBlogPosts(): Promise<BlogPostDto[]> {
  return api.get<BlogPostDto[]>('/blog-posts/admin/all');
}

export type BlogPostWritePayload = {
  publishedAt: string;
  titleEn: string;
  titleHy: string;
  bodyEn: string[];
  bodyHy: string[];
  slug?: string;
  dateColor?: string;
  imageClassName?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
  image?: File | null;
};

function toFormData(payload: BlogPostWritePayload): FormData {
  const formData = new FormData();
  formData.append('publishedAt', payload.publishedAt);
  formData.append('titleEn', payload.titleEn);
  formData.append('titleHy', payload.titleHy);
  appendBody(formData, 'bodyEn', payload.bodyEn);
  appendBody(formData, 'bodyHy', payload.bodyHy);

  if (payload.slug) formData.append('slug', payload.slug);
  if (payload.dateColor) formData.append('dateColor', payload.dateColor);
  if (payload.imageClassName != null) {
    formData.append('imageClassName', payload.imageClassName);
  }
  if (payload.sortOrder != null) {
    formData.append('sortOrder', String(payload.sortOrder));
  }
  if (payload.isPublished != null) {
    formData.append('isPublished', String(payload.isPublished));
  }
  if (payload.image) {
    formData.append('image', payload.image);
  }

  return formData;
}

export async function createBlogPost(payload: BlogPostWritePayload): Promise<BlogPostDto> {
  if (!payload.image) {
    throw new Error('Image is required');
  }
  return api.post<BlogPostDto>('/blog-posts', toFormData(payload));
}

export async function updateBlogPost(
  id: string,
  payload: Partial<BlogPostWritePayload>,
): Promise<BlogPostDto> {
  const formData = new FormData();

  if (payload.publishedAt) formData.append('publishedAt', payload.publishedAt);
  if (payload.titleEn) formData.append('titleEn', payload.titleEn);
  if (payload.titleHy) formData.append('titleHy', payload.titleHy);
  if (payload.bodyEn) appendBody(formData, 'bodyEn', payload.bodyEn);
  if (payload.bodyHy) appendBody(formData, 'bodyHy', payload.bodyHy);
  if (payload.slug) formData.append('slug', payload.slug);
  if (payload.dateColor) formData.append('dateColor', payload.dateColor);
  if (payload.imageClassName != null) {
    formData.append('imageClassName', payload.imageClassName);
  }
  if (payload.sortOrder != null) {
    formData.append('sortOrder', String(payload.sortOrder));
  }
  if (payload.isPublished != null) {
    formData.append('isPublished', String(payload.isPublished));
  }
  if (payload.image) {
    formData.append('image', payload.image);
  }

  return api.patch<BlogPostDto>(`/blog-posts/${encodeURIComponent(id)}`, formData);
}

export async function deleteBlogPost(id: string): Promise<{ success: true }> {
  return api.delete<{ success: true }>(`/blog-posts/${encodeURIComponent(id)}`);
}
