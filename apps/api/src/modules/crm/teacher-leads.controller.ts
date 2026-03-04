import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadsService } from './leads.service';
import { TeacherTransferDto } from './dto';

@ApiTags('teacher')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('teacher/leads')
@Roles(UserRole.TEACHER)
export class TeacherLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads assigned to the current teacher' })
  findMyLeads(
    @Query('groupId') groupId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.findForTeacher(user.sub, { groupId });
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve first lesson – move lead to PAID' })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.teacherApprove(id, user.sub);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Request transfer (wrong group) – add comment and set transfer flag' })
  transfer(
    @Param('id') id: string,
    @Body() dto: TeacherTransferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.teacherTransfer(id, dto, user.sub);
  }
}
