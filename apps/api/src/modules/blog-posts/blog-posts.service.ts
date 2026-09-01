import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlogPost, Prisma } from '@ilona/database';
import type { BlogPostDto } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateBlogPostDto } from './dto/create-blog-post.dto';
import type { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import {
  BLOG_IMAGE_MIME,
  MAX_BLOG_IMAGE_SIZE,
  parseBodyJson,
  pickDateColor,
  slugifyBlogTitle,
  toStorageFileUrl,
} from './blog-posts.util';

@Injectable()
export class BlogPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async listPublic(): Promise<BlogPostDto[]> {
    const posts = await this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return posts.map((post) => this.toDto(post));
  }

  async listAll(): Promise<BlogPostDto[]> {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return posts.map((post) => this.toDto(post));
  }

  async getBySlug(slug: string, options?: { includeDrafts?: boolean }): Promise<BlogPostDto> {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || (!options?.includeDrafts && !post.isPublished)) {
      throw new NotFoundException('Blog post not found');
    }
    return this.toDto(post);
  }

  async getById(id: string): Promise<BlogPostDto> {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    return this.toDto(post);
  }

  async create(dto: CreateBlogPostDto, image: Express.Multer.File): Promise<BlogPostDto> {
    this.assertValidImage(image);

    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || slugifyBlogTitle(dto.titleEn));
    const count = await this.prisma.blogPost.count();
    const upload = await this.storageService.upload(
      image.buffer,
      image.originalname,
      image.mimetype,
      'blog',
    );

    try {
      const post = await this.prisma.blogPost.create({
        data: {
          slug,
          publishedAt: new Date(dto.publishedAt),
          titleEn: dto.titleEn.trim(),
          titleHy: dto.titleHy.trim(),
          bodyEn: dto.bodyEn.map((p) => p.trim()).filter(Boolean),
          bodyHy: dto.bodyHy.map((p) => p.trim()).filter(Boolean),
          imageKey: upload.key,
          dateColor: dto.dateColor?.trim() || pickDateColor(count),
          imageClassName: dto.imageClassName?.trim() || null,
          sortOrder: dto.sortOrder ?? count,
          isPublished: dto.isPublished ?? true,
        },
      });
      return this.toDto(post);
    } catch (error) {
      await this.safeDeleteStorage(upload.key);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateBlogPostDto,
    image?: Express.Multer.File,
  ): Promise<BlogPostDto> {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    let nextImageKey = existing.imageKey;
    let uploadedKey: string | null = null;

    if (image) {
      this.assertValidImage(image);
      const upload = await this.storageService.upload(
        image.buffer,
        image.originalname,
        image.mimetype,
        'blog',
      );
      nextImageKey = upload.key;
      uploadedKey = upload.key;
    }

    const data: Prisma.BlogPostUpdateInput = {};

    if (dto.slug !== undefined) {
      data.slug = await this.ensureUniqueSlug(dto.slug.trim(), id);
    }
    if (dto.publishedAt !== undefined) {
      data.publishedAt = new Date(dto.publishedAt);
    }
    if (dto.titleEn !== undefined) {
      data.titleEn = dto.titleEn.trim();
    }
    if (dto.titleHy !== undefined) {
      data.titleHy = dto.titleHy.trim();
    }
    if (dto.bodyEn !== undefined) {
      data.bodyEn = dto.bodyEn.map((p) => p.trim()).filter(Boolean);
    }
    if (dto.bodyHy !== undefined) {
      data.bodyHy = dto.bodyHy.map((p) => p.trim()).filter(Boolean);
    }
    if (dto.dateColor !== undefined) {
      data.dateColor = dto.dateColor.trim();
    }
    if (dto.imageClassName !== undefined) {
      data.imageClassName = dto.imageClassName?.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }
    if (uploadedKey) {
      data.imageKey = nextImageKey;
      data.overlayKey = null;
    }

    try {
      const post = await this.prisma.blogPost.update({
        where: { id },
        data,
      });

      if (uploadedKey && existing.imageKey !== uploadedKey) {
        await this.safeDeleteStorage(existing.imageKey);
        if (existing.overlayKey) {
          await this.safeDeleteStorage(existing.overlayKey);
        }
      }

      return this.toDto(post);
    } catch (error) {
      if (uploadedKey) {
        await this.safeDeleteStorage(uploadedKey);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: true }> {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.delete({ where: { id } });
    await this.safeDeleteStorage(existing.imageKey);
    if (existing.overlayKey) {
      await this.safeDeleteStorage(existing.overlayKey);
    }

    return { success: true };
  }

  private toDto(post: BlogPost): BlogPostDto {
    return {
      id: post.id,
      slug: post.slug,
      publishedAt: post.publishedAt.toISOString(),
      titleEn: post.titleEn,
      titleHy: post.titleHy,
      bodyEn: parseBodyJson(post.bodyEn),
      bodyHy: parseBodyJson(post.bodyHy),
      imageUrl: toStorageFileUrl(post.imageKey),
      overlayUrl: post.overlayKey ? toStorageFileUrl(post.overlayKey) : null,
      dateColor: post.dateColor,
      imageClassName: post.imageClassName,
      sortOrder: post.sortOrder,
      isPublished: post.isPublished,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private assertValidImage(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (!BLOG_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload PNG, JPG, or WEBP.');
    }
    if (file.size > MAX_BLOG_IMAGE_SIZE) {
      throw new BadRequestException('File size too large. Please upload an image smaller than 5MB.');
    }
  }

  private async ensureUniqueSlug(candidate: string, excludeId?: string): Promise<string> {
    const base = slugifyBlogTitle(candidate);
    let slug = base;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return slug;
      }
      slug = `${base}-${suffix}`;
      suffix += 1;
      if (suffix > 100) {
        throw new ConflictException('Unable to generate a unique slug');
      }
    }
  }

  private async safeDeleteStorage(key: string): Promise<void> {
    try {
      await this.storageService.delete(key);
    } catch {
      // Best effort cleanup
    }
  }
}
