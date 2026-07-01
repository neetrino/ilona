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
import { Roles } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import type { PenaltyAmountsInput } from '@ilona/types';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsPenaltiesController {
  private readonly logger = new Logger(SettingsPenaltiesController.name);

  constructor(private readonly settingsService: SettingsService) {}

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

  @Put('penalties')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update penalty amounts (Admin only)' })
  async updatePenalties(@Body() body: PenaltyAmountsInput) {
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
