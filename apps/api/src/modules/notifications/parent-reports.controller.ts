import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';
import {
  PreviewParentReportDto,
  QueryParentReportsDto,
  SendParentQuarterDto,
  SendParentReportDto,
} from './dto/parent-report.dto';
import { ParentReportService } from './parent-report.service';

@Controller('parent-reports')
export class ParentReportsController {
  constructor(private readonly reports: ParentReportService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(@Query() query: QueryParentReportsDto, @CurrentUser() user: JwtPayload) {
    return this.reports.list(query.quarterKey, user);
  }

  @Get('preview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  preview(@Query() query: PreviewParentReportDto, @CurrentUser() user: JwtPayload) {
    return this.reports.preview(query.studentId, query.quarterKey, user);
  }

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  send(@Body() dto: SendParentReportDto, @CurrentUser() user: JwtPayload) {
    return this.reports.sendOne(dto.studentId, dto.quarterKey, user);
  }

  @Post('send-all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  sendAll(@Body() dto: SendParentQuarterDto, @CurrentUser() user: JwtPayload) {
    return this.reports.sendAll(dto.quarterKey, user, dto.studentIds);
  }
}
