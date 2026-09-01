export type BlogPostBody = string[];

export type BlogPostDto = {
  id: string;
  slug: string;
  publishedAt: string;
  titleEn: string;
  titleHy: string;
  bodyEn: BlogPostBody;
  bodyHy: BlogPostBody;
  imageUrl: string;
  overlayUrl: string | null;
  dateColor: string;
  imageClassName: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBlogPostDto = {
  slug?: string;
  publishedAt: string;
  titleEn: string;
  titleHy: string;
  bodyEn: BlogPostBody;
  bodyHy: BlogPostBody;
  dateColor?: string;
  imageClassName?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
};

export type UpdateBlogPostDto = Partial<CreateBlogPostDto>;

export const BLOG_DATE_COLORS = [
  'text-[#1447e6]',
  'text-[#008236]',
  'text-[#8200db]',
] as const;

export type BlogDateColor = (typeof BLOG_DATE_COLORS)[number];
