/// <reference types="multer" />
import {
  Controller,
  Get,
  Post,
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
import { UserRole } from '@ilona/database';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
import {
  LOGO_TYPES,
  MAX_LOGO_SIZE,
} from './settings-controller.constants';
import {
  cacheBusterFromKey,
  contentTypeFromKey,
  createImageValidationExceptionFactory,
  sendImageResponse,
} from './settings-image.util';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsLogoController {
  private readonly logger = new Logger(SettingsLogoController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
  ) {}

  @Get('logo')
  @Public()
  @ApiOperation({ summary: 'Get current logo URL (public - all roles)' })
  async getLogo() {
    try {
      const { logoKey } = await this.settingsService.getLogoKey();
      const cacheBuster = logoKey ? cacheBusterFromKey(logoKey) : '';
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

  @Get('logo/image')
  @Public()
  @ApiOperation({ summary: 'Serve logo image (public - all roles)' })
  async getLogoImage(@Res() res: Response) {
    try {
      const { logoKey } = await this.settingsService.getLogoKey();

      if (!logoKey) {
        throw new NotFoundException('Logo not found');
      }

      const fileBuffer = await this.storageService.getFile(logoKey);

      if (!fileBuffer) {
        throw new NotFoundException('Logo file not found in storage');
      }

      sendImageResponse(res, fileBuffer, contentTypeFromKey(logoKey));
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
        exceptionFactory: createImageValidationExceptionFactory(MAX_LOGO_SIZE / 1024 / 1024),
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
      const result = await this.storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        'settings',
      );

      await this.settingsService.updateLogoKey(result.key);

      const cacheBuster = cacheBusterFromKey(result.key);
      return {
        success: true,
        data: {
          logoUrl: `/api/settings/logo/image?v=${cacheBuster}`,
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

  @Post('logo/delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete logo (Admin only)' })
  async deleteLogo() {
    try {
      const { logoKey } = await this.settingsService.getLogoKey();

      if (logoKey) {
        try {
          await this.storageService.delete(logoKey);
          this.logger.log(`Logo deleted from storage: ${logoKey}`);
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete logo file from storage: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
          );
        }
      }

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
}
