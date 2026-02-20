import {
  Controller,
  Get,
  Post,
  Put,
  Body,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';

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
   * Returns a stable proxy URL that works in all environments
   */
  @Get('logo')
  @Public()
  @ApiOperation({ summary: 'Get current logo URL (public - all roles)' })
  async getLogo() {
    try {
      const { logoKey } = await this.settingsService.getLogoKey();
      
      // Always return the proxy URL, which works in all environments (localhost, IP, domain)
      // This ensures the logo is accessible regardless of how the app is accessed
      // Add cache-busting query parameter using the logoKey to ensure new uploads are fetched
      // The key changes on every upload (UUID-based), so this effectively busts the cache
      const cacheBuster = logoKey ? encodeURIComponent(logoKey.split('/').pop() || logoKey) : '';
      return {
        logoUrl: logoKey ? `/api/settings/logo/image?v=${cacheBuster}` : null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get logo: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve logo. Please try again later.');
    }
  }

  /**
   * Serve logo image (public - accessible to all)
   * This endpoint proxies the logo from R2/local storage, ensuring it works in all environments
   */
  @Get('logo/image')
  @Public()
  @ApiOperation({ summary: 'Serve logo image (public - all roles)' })
  async getLogoImage(@Res() res: Response) {
    try {
      const { logoKey } = await this.settingsService.getLogoKey();
      
      if (!logoKey) {
        throw new NotFoundException('Logo not found');
      }

      // Get file from storage service
      const fileBuffer = await this.storageService.getFile(logoKey);
      
      if (!fileBuffer) {
        throw new NotFoundException('Logo file not found in storage');
      }

      // Determine content type from file extension
      const ext = path.extname(logoKey).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
      };
      
      const contentType = contentTypeMap[ext] || 'image/png';
      
      // Set headers for caching and CORS
      // Use shorter cache time and allow revalidation since we use cache-busting query params
      // The query param (?v=...) changes on each upload, so browsers will fetch the new image
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate'); // Cache for 1 day, must revalidate
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to serve logo image: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to serve logo. Please try again later.');
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

      // Store the R2 key (not the URL) in the database
      // This ensures we can retrieve the file regardless of environment
      await this.settingsService.updateLogoKey(result.key);

      // Return the proxy URL with cache-busting query parameter
      // The key changes on every upload (UUID-based), so this ensures browsers fetch the new image
      const cacheBuster = encodeURIComponent(result.key.split('/').pop() || result.key);
      return {
        success: true,
        data: {
          logoUrl: `/api/settings/logo/image?v=${cacheBuster}`, // Proxy URL with cache-busting
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
      // Get current logo key to delete from storage
      const { logoKey } = await this.settingsService.getLogoKey();

      if (logoKey) {
        try {
          // Delete the file from R2/local storage
          await this.storageService.delete(logoKey);
          this.logger.log(`Logo deleted from storage: ${logoKey}`);
        } catch (deleteError) {
          // Log error but don't fail - the file might not exist or already be deleted
          this.logger.warn(
            `Failed to delete logo file from storage: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
          );
        }
      }

      // Clear logo key in database
      await this.settingsService.updateLogoKey(null);

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
   * Update action percent settings (Admin only) - DEPRECATED
   */
  @Put('action-percents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update action percent settings (Admin only) - DEPRECATED' })
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

  /**
   * Get penalty amounts (Admin only)
   */
  @Get('penalties')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get penalty amounts (Admin only)' })
  async getPenalties() {
    try {
      return await this.settingsService.getPenaltyAmounts();
    } catch (error) {
      this.logger.error(
        `Failed to get penalties: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve penalty settings. Please try again later.');
    }
  }

  /**
   * Update penalty amounts (Admin only)
   */
  @Put('penalties')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update penalty amounts (Admin only)' })
  async updatePenalties(
    @Body() body: {
      penaltyAbsenceAmd: number;
      penaltyFeedbackAmd: number;
      penaltyVoiceAmd: number;
      penaltyTextAmd: number;
    },
  ) {
    try {
      return await this.settingsService.updatePenaltyAmounts(body);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to update penalties: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to update penalty settings. Please try again later.');
    }
  }
}

