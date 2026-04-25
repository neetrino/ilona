import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadsService } from '../crm/leads.service';
import { CentersService } from '../centers/centers.service';
import { UpdateVoiceRecordingCenterDto } from './dto/update-voice-recording-center.dto';

const MAX_VOICE_SIZE = 25 * 1024 * 1024; // 25MB

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly centersService: CentersService,
  ) {}

  @Get('centers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List active centers (id + name) for admin clients' })
  async listActiveCenters(@CurrentUser() user: JwtPayload) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may use this endpoint');
    }
    return this.centersService.findActiveIdNameList();
  }

  @Post('recordings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload voice recording and create a NEW CRM lead (voice app)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'centerId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        centerId: { type: 'string' },
        durationSec: { type: 'string', description: 'Optional duration in seconds (integer)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVoiceRecording(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: MAX_VOICE_SIZE })],
        exceptionFactory: (error) =>
          new BadRequestException(
            error.includes('File is too large')
              ? `Audio file must be under ${MAX_VOICE_SIZE / 1024 / 1024}MB`
              : `File validation failed: ${error}`,
          ),
      }),
    )
    file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
    @Body('centerId') centerId?: string,
    @Body('durationSec') durationSecRaw?: unknown,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may use this endpoint');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('No audio file provided');
    }
    return this.leadsService.createLeadFromVoice(file, user.sub, user, {
      centerId,
      leadSource: 'VOICE_APP',
      durationSecRaw,
      durationParsing: 'strict',
      requireActiveCenter: true,
    });
  }

  @Get('voice-recordings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List CRM voice-app recordings history (admin only)' })
  async listVoiceRecordings(@CurrentUser() user: JwtPayload) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may use this endpoint');
    }
    return this.leadsService.findVoiceAppRecordingsForAdmin(user);
  }

  @Patch('voice-recordings/:leadId/center')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update center for CRM voice-app recording lead (admin only)' })
  async updateVoiceRecordingCenter(
    @Param('leadId') leadId: string,
    @Body() dto: UpdateVoiceRecordingCenterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may use this endpoint');
    }
    return this.leadsService.updateVoiceAppRecordingCenter(leadId, dto.centerId, user);
  }
}
