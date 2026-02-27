import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  QueryLeadDto,
  ChangeStatusDto,
  AddCommentDto,
  ConfirmRecordingDto,
} from './dto';

@ApiTags('crm')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new lead' })
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: JwtPayload) {
    return this.leadsService.create(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List leads with filters and pagination' })
  findAll(@Query() query: QueryLeadDto, @CurrentUser() user: JwtPayload) {
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
      user.role,
    );
  }

  @Get('allowed-transitions/:status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get allowed next statuses for a given status' })
  getAllowedTransitions(@Param('status') status: string) {
    return this.leadsService.getAllowedTransitions(status as import('@prisma/client').CrmLeadStatus);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get lead by ID' })
  findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.findById(id, user.sub, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update lead' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.update(id, dto, user.sub, user.role);
  }

  @Post(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Change lead status (only allowed transitions)' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.changeStatus(id, dto, user.sub);
  }

  @Get(':id/activities')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get lead activity timeline' })
  getActivities(@Param('id') id: string) {
    return this.leadsService.getActivities(id);
  }

  @Post(':id/comments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Add comment to lead' })
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.addComment(id, dto, user.sub);
  }

  @Post(':id/recordings/presign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get presigned URL for voice recording upload' })
  getPresignedRecordingUrl(
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string },
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.leadsService.getPresignedRecordingUrl(
      id,
      body.fileName,
      body.mimeType,
    );
  }

  @Post(':id/recordings/confirm')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Confirm recording upload and attach to lead' })
  confirmRecording(
    @Param('id') id: string,
    @Body() dto: ConfirmRecordingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.confirmRecording(id, dto, user.sub);
  }
}
