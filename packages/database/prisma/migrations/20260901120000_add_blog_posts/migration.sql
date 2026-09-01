-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleHy" TEXT NOT NULL,
    "bodyEn" JSONB NOT NULL,
    "bodyHy" JSONB NOT NULL,
    "imageKey" TEXT NOT NULL,
    "overlayKey" TEXT,
    "dateColor" TEXT NOT NULL DEFAULT 'text-[#1447e6]',
    "imageClassName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "blog_posts_isPublished_publishedAt_idx" ON "blog_posts"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "blog_posts_sortOrder_idx" ON "blog_posts"("sortOrder");
