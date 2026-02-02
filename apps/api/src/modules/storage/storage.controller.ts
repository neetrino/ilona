import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// Allowed MIME types
const IMAGE_TYPES = /^image\/(jpeg|png|gif|webp)$/;
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
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() _user: JwtPayload,
  ) {
    const result = await this.storageService.uploadAvatar(
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
