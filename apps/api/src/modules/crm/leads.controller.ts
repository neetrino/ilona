import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import { UserRole, CrmLeadStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  QueryLeadDto,
  ChangeStatusDto,
  ChangeBranchDto,
  AddCommentDto,
  ConfirmRecordingDto,
} from './dto';
import { CreateStudentDto } from '../students/dto/create-student.dto';

const MAX_VOICE_SIZE = 25 * 1024 * 1024; // 25MB

@ApiTags('crm')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new lead' })
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.leadsService.create(dto, user.sub, user);
  }

  @Post('voice')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new lead from voice recording (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        centerId: { type: 'string' },
        durationSec: { type: 'number', description: 'Optional recording duration in seconds' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  createFromVoice(
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
    if (!file?.buffer?.length) {
      throw new BadRequestException('No audio file provided. Please record and send a voice message.');
    }
    return this.leadsService.createLeadFromVoice(file, user.sub, user, {
      centerId,
      durationSecRaw,
      durationParsing: 'loose',
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List leads with filters and pagination' })
  findAll(@Query() query: QueryLeadDto, @CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.leadsService.findAll(
      {
        skip: query.skip,
        take: query.take,
        search: query.search,
        status: query.status,
        centerId: query.centerId,
        teacherId: query.teacherId,
        groupId: query.groupId,
        levelId: query.levelId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      user,
    );
  }

  @Get('allowed-transitions/:status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get allowed next statuses for a given status' })
  getAllowedTransitions(@Param('status') status: string) {
    return this.leadsService.getAllowedTransitions(status as CrmLeadStatus);
  }

  @Get('statuses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all CRM statuses (for Admin manual status control)' })
  getStatuses() {
    return this.leadsService.getStatuses();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get lead by ID' })
  findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.findById(id, user.sub, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update lead' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.leadsService.update(id, dto, user.sub, user);
  }

  @Post(':id/register-paid')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Complete Paid registration',
    description:
      'Updates lead fields, sets status to Paid, and creates the linked student. Use this instead of POST :id/status for Paid.',
  })
  registerPaid(
    @Param('id') id: string,
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.leadsService.registerPaidLead(id, dto, user.sub, user);
  }

  @Post(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Change lead status (Admin can set any status)' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.leadsService.changeStatus(id, dto, user.sub, {
      user,
    });
  }

  @Post(':id/branch')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change lead branch and auto-route manager assignment' })
  changeBranch(
    @Param('id') id: string,
    @Body() dto: ChangeBranchDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.leadsService.changeBranch(id, dto, user.sub, user);
  }

  @Get(':id/activities')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get lead activity timeline' })
  getActivities(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.leadsService.getActivities(id, user);
  }

  @Post(':id/comments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Add comment to lead' })
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.leadsService.addComment(id, dto, user.sub, user);
  }

  @Post(':id/recordings/presign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get presigned URL for CRM lead voice upload (admin only)' })
  getPresignedRecordingUrl(
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getPresignedRecordingUrl(
      id,
      body.fileName,
      body.mimeType,
      user,
    );
  }

  @Post(':id/recordings/confirm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm CRM lead voice upload and attach (admin only)' })
  confirmRecording(
    @Param('id') id: string,
    @Body() dto: ConfirmRecordingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.confirmRecording(id, dto, user.sub, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a lead (and its voice recordings)' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.delete(id, user);
  }
}
