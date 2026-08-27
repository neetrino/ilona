import { getLandingBlogPostSlugs } from '@/features/landing/landingBlogContent';
import { LandingBlogPostPageContent } from '@/features/landing/components/LandingBlogPostPageContent';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getLandingBlogPostSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return <LandingBlogPostPageContent slug={slug} />;
}
