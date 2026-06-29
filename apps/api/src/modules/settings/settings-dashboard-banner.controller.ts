import {
  Controller,
  Get,
  Post,
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
import { UserRole } from '@ilona/database';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
import {
  DASHBOARD_BANNER_TYPES,
  MAX_DASHBOARD_BANNER_SIZE,
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
export class SettingsDashboardBannerController {
  private readonly logger = new Logger(SettingsDashboardBannerController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
  ) {}

  @Get('dashboard-banner')
  @Public()
  @ApiOperation({ summary: 'Get dashboard banner URL (public - all roles)' })
  async getDashboardBanner() {
    try {
      const [{ dashboardBannerKey }, { title, subtitle }] = await Promise.all([
        this.settingsService.getDashboardBannerKey(),
        this.settingsService.getDashboardBannerText(),
      ]);
      const cacheBuster = dashboardBannerKey ? cacheBusterFromKey(dashboardBannerKey) : '';

      return {
        bannerUrl: dashboardBannerKey
          ? `/api/settings/dashboard-banner/image?v=${cacheBuster}`
          : null,
        title,
        subtitle,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard banner: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve dashboard banner. Please try again later.');
    }
  }

  @Get('dashboard-banner/image')
  @Public()
  @ApiOperation({ summary: 'Serve dashboard banner image (public - all roles)' })
  async getDashboardBannerImage(@Res() res: Response) {
    try {
      const { dashboardBannerKey } = await this.settingsService.getDashboardBannerKey();

      if (!dashboardBannerKey) {
        throw new NotFoundException('Dashboard banner not found');
      }

      const fileBuffer = await this.storageService.getFile(dashboardBannerKey);
      if (!fileBuffer) {
        throw new NotFoundException('Dashboard banner file not found in storage');
      }

      sendImageResponse(res, fileBuffer, contentTypeFromKey(dashboardBannerKey));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to serve dashboard banner image: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to serve dashboard banner. Please try again later.');
    }
  }

  @Post('dashboard-banner')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload dashboard banner image (Admin only)' })
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
  async uploadDashboardBanner(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_DASHBOARD_BANNER_SIZE }),
          new FileTypeValidator({ fileType: DASHBOARD_BANNER_TYPES }),
        ],
        exceptionFactory: createImageValidationExceptionFactory(
          MAX_DASHBOARD_BANNER_SIZE / 1024 / 1024,
        ),
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
      const { dashboardBannerKey: currentBannerKey } =
        await this.settingsService.getDashboardBannerKey();

      const result = await this.storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        'settings',
      );

      await this.settingsService.updateDashboardBannerKey(result.key);

      if (currentBannerKey && currentBannerKey !== result.key) {
        try {
          await this.storageService.delete(currentBannerKey);
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete previous dashboard banner file: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
          );
        }
      }

      const cacheBuster = cacheBusterFromKey(result.key);
      return {
        success: true,
        data: {
          bannerUrl: `/api/settings/dashboard-banner/image?v=${cacheBuster}`,
          key: result.key,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload dashboard banner: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof PayloadTooLargeException ||
        error instanceof UnsupportedMediaTypeException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to upload dashboard banner. Please try again later.',
      );
    }
  }

  @Post('dashboard-banner/delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete dashboard banner image (Admin only)' })
  async deleteDashboardBanner() {
    try {
      const { dashboardBannerKey } = await this.settingsService.getDashboardBannerKey();
      if (dashboardBannerKey) {
        try {
          await this.storageService.delete(dashboardBannerKey);
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete dashboard banner file from storage: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
          );
        }
      }

      await this.settingsService.updateDashboardBannerKey(null);

      return {
        success: true,
        message: 'Dashboard banner deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete dashboard banner: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to delete dashboard banner. Please try again later.',
      );
    }
  }

  @Post('dashboard-banner/text')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update dashboard banner text (Admin only)' })
  async updateDashboardBannerText(
    @Body() body: { title?: string | null; subtitle?: string | null },
  ) {
    try {
      const result = await this.settingsService.updateDashboardBannerText(body);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to update dashboard banner text: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to update dashboard banner text. Please try again later.',
      );
    }
  }
}
