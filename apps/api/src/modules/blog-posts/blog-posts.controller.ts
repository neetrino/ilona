import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@ilona/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Public, Roles } from '../../common/decorators';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { MAX_BLOG_IMAGE_SIZE } from './blog-posts.util';

@ApiTags('blog-posts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published blog posts (public)' })
  listPublic() {
    return this.blogPostsService.listPublic();
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all blog posts including drafts (Admin/Manager)' })
  listAll() {
    return this.blogPostsService.listAll();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published blog post by slug (public)' })
  getBySlug(@Param('slug') slug: string) {
    return this.blogPostsService.getBySlug(slug);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a blog post (Admin/Manager)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['publishedAt', 'titleEn', 'titleHy', 'bodyEn', 'bodyHy', 'image'],
      properties: {
        publishedAt: { type: 'string', format: 'date-time' },
        titleEn: { type: 'string' },
        titleHy: { type: 'string' },
        bodyEn: { type: 'string', description: 'JSON array or paragraphs separated by blank lines' },
        bodyHy: { type: 'string', description: 'JSON array or paragraphs separated by blank lines' },
        slug: { type: 'string' },
        dateColor: { type: 'string' },
        imageClassName: { type: 'string' },
        sortOrder: { type: 'integer' },
        isPublished: { type: 'boolean' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_BLOG_IMAGE_SIZE },
    }),
  )
  create(
    @Body() dto: CreateBlogPostDto,
    @UploadedFile() image: Express.Multer.File | undefined,
  ) {
    if (!image) {
      throw new BadRequestException('Image file is required');
    }
    return this.blogPostsService.create(dto, image);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a blog post (Admin/Manager)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publishedAt: { type: 'string', format: 'date-time' },
        titleEn: { type: 'string' },
        titleHy: { type: 'string' },
        bodyEn: { type: 'string' },
        bodyHy: { type: 'string' },
        slug: { type: 'string' },
        dateColor: { type: 'string' },
        imageClassName: { type: 'string' },
        sortOrder: { type: 'integer' },
        isPublished: { type: 'boolean' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_BLOG_IMAGE_SIZE },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @UploadedFile() image: Express.Multer.File | undefined,
  ) {
    return this.blogPostsService.update(id, dto, image);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a blog post (Admin/Manager)' })
  remove(@Param('id') id: string) {
    return this.blogPostsService.remove(id);
  }
}
