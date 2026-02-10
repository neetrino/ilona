import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  NotFoundException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';

// Max file sizes
// Note: Base64 encoding increases size by ~33%, so 5MB file becomes ~6.7MB base64
// We limit to 5MB to ensure base64 stays under 10MB for database storage
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for avatars (becomes ~6.7MB base64)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// Allowed MIME types - allow jpg as well as jpeg
const IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;
const FILE_TYPES = /^(image|application|audio|video)\//;

interface PresignedUrlDto {
  fileName: string;
  mimeType: string;
  folder?: 'avatars' | 'chat' | 'documents';
}

@ApiTags('storage')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload avatar image
   */
  @Post('avatar')
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new FileTypeValidator({ fileType: IMAGE_TYPES }),
        ],
        exceptionFactory: (error) => {
          if (error.includes('File is too large')) {
            throw new PayloadTooLargeException(
              `File size exceeds the maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
            );
          }
          if (error.includes('File type')) {
            throw new UnsupportedMediaTypeException(
              'Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.',
            );
          }
          throw new BadRequestException(`File validation failed: ${error}`);
        },
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() _user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty');
    }

    try {
      const result = await this.storageService.uploadAvatar(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      // Result.url now contains base64 data URL (data:image/jpeg;base64,...)
      // This will be saved directly in the database
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      
      if (error instanceof BadRequestException || 
          error instanceof PayloadTooLargeException || 
          error instanceof UnsupportedMediaTypeException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to upload file. Please try again later.',
      );
    }
  }

  /**
   * Upload chat file (image, document, audio, video)
   */
  @Post('chat')
  @ApiOperation({ summary: 'Upload chat file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: FILE_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() _user: JwtPayload,
  ) {
    const result = await this.storageService.uploadChatFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Upload document
   */
  @Post('document')
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() _user: JwtPayload,
  ) {
    const result = await this.storageService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get presigned URL for client-side upload
   */
  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  async getPresignedUrl(
    @Body() dto: PresignedUrlDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    if (!dto.fileName || !dto.mimeType) {
      throw new BadRequestException('fileName and mimeType are required');
    }

    const result = await this.storageService.getPresignedUploadUrl(
      dto.fileName,
      dto.mimeType,
      dto.folder || 'uploads',
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get a file (for local storage - public endpoint, no auth required)
   */
  @Get('file/:key(*)')
  @Public()
  @ApiOperation({ summary: 'Get a file (public endpoint for local storage)' })
  async getFile(
    @Param('key') key: string,
    @Res() res: Response,
  ) {
    try {
      // Decode the key (it may be URL encoded)
      const decodedKey = decodeURIComponent(key);
      
      // Get file from storage service
      const fileBuffer = await this.storageService.getFile(decodedKey);
      
      if (!fileBuffer) {
        throw new NotFoundException('File not found');
      }

      // Determine content type from file extension
      const ext = path.extname(decodedKey).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
      };
      
      const contentType = contentTypeMap[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get file: ${error instanceof Error ? error.message : String(error)}`);
      throw new NotFoundException('File not found');
    }
  }

  /**
   * Delete a file
   */
  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('key') key: string,
    @CurrentUser() _user: JwtPayload,
  ) {
    // Decode the key (it may be URL encoded)
    const decodedKey = decodeURIComponent(key);

    await this.storageService.delete(decodedKey);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

}
