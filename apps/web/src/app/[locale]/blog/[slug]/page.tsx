import { LandingBlogPostPageContent } from '@/features/landing/components/LandingBlogPostPageContent';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return <LandingBlogPostPageContent slug={slug} />;
}
