import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';

// Max file size: 5MB for logo
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed MIME types for logo: PNG, JPG/JPEG, WEBP, SVG
// Note: SVG can be image/svg+xml or image/svg
const LOGO_TYPES = /^image\/(png|jpeg|jpg|webp|svg(\+xml)?)$/i;

@ApiTags('settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get current logo URL (public - accessible to all)
   */
  @Get('logo')
  @Public()
  @ApiOperation({ summary: 'Get current logo URL (public - all roles)' })
  async getLogo() {
    try {
      return await this.settingsService.getLogoUrl();
    } catch (error) {
      this.logger.error(
        `Failed to get logo: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve logo. Please try again later.');
    }
  }

  /**
   * Upload logo (Admin only)
   */
  @Post('logo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload logo (Admin only)' })
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
  async uploadLogo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_LOGO_SIZE }),
          new FileTypeValidator({ fileType: LOGO_TYPES }),
        ],
        exceptionFactory: (error) => {
          if (error.includes('File is too large')) {
            throw new PayloadTooLargeException(
              `File size exceeds the maximum allowed size of ${MAX_LOGO_SIZE / 1024 / 1024}MB`,
            );
          }
          if (error.includes('File type')) {
            throw new UnsupportedMediaTypeException(
              'Invalid file type. Only PNG, JPG, WEBP, and SVG images are allowed.',
            );
          }
          throw new BadRequestException(`File validation failed: ${error}`);
        },
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty');
    }

    try {
      // Upload to R2 storage in 'settings' folder
      const result = await this.storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        'settings',
      );

      // Update system settings with the logo URL
      const { logoUrl } = await this.settingsService.updateLogoUrl(result.url);

      return {
        success: true,
        data: {
          logoUrl,
          key: result.key,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload logo: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof PayloadTooLargeException ||
        error instanceof UnsupportedMediaTypeException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload logo. Please try again later.');
    }
  }

  /**
   * Delete logo (Admin only)
   */
  @Post('logo/delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete logo (Admin only)' })
  async deleteLogo() {
    try {
      // Get current logo to delete from storage
      const { logoUrl } = await this.settingsService.getLogoUrl();

      if (logoUrl) {
        // Extract key from URL if it's a storage key
        // Logo URL format: either public URL or storage key
        // If it's a public URL, we need to extract the key
        // For now, we'll just clear the database reference
        // The old file in R2 will remain (can be cleaned up manually or via cron)
      }

      // Clear logo URL in database
      await this.settingsService.updateLogoUrl(null);

      return {
        success: true,
        message: 'Logo deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete logo: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete logo. Please try again later.');
    }
  }

  /**
   * Get action percent settings (Admin only)
   */
  @Get('action-percents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get action percent settings (Admin only)' })
  async getActionPercents() {
    try {
      return await this.settingsService.getActionPercents();
    } catch (error) {
      this.logger.error(
        `Failed to get action percents: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve action percent settings. Please try again later.');
    }
  }

  /**
   * Update action percent settings (Admin only)
   */
  @Put('action-percents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update action percent settings (Admin only)' })
  async updateActionPercents(
    @Body() body: {
      absencePercent: number;
      feedbacksPercent: number;
      voicePercent: number;
      textPercent: number;
    },
  ) {
    try {
      return await this.settingsService.updateActionPercents(body);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to update action percents: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to update action percent settings. Please try again later.');
    }
  }
}

