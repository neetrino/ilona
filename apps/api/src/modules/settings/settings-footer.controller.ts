import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsFooterController {
  private readonly logger = new Logger(SettingsFooterController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get('footer-icon-links')
  @Public()
  @ApiOperation({ summary: 'Get footer social icon links (public - all roles)' })
  async getFooterIconLinks() {
    try {
      return await this.settingsService.getFooterIconLinks();
    } catch (error) {
      this.logger.error(
        `Failed to get footer icon links: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve footer icon links. Please try again later.',
      );
    }
  }

  @Put('footer-icon-links')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update footer social icon links (Admin only)' })
  async updateFooterIconLinks(
    @Body() body: Partial<Record<string, string | null>>,
  ) {
    try {
      const result = await this.settingsService.updateFooterIconLinks(body);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to update footer icon links: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to update footer icon links. Please try again later.',
      );
    }
  }
}
