import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SalaryStatus } from '@ilona/database';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { SalariesService } from './salaries.service';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { FinanceControllerScopeService } from './finance-controller-scope.service';

@Controller('finance')
export class FinanceSalariesController {
  constructor(
    private readonly salariesService: SalariesService,
    private readonly scope: FinanceControllerScopeService,
  ) {}

  @Get('salaries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalaries(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<unknown> {
    return this.salariesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId,
      status: status as SalaryStatus | undefined,
      q: q?.trim() || undefined,
      centerId: getManagerCenterIdOrThrow(user),
    });
  }

  @Post('salaries')
  @Roles(UserRole.ADMIN)
  async createSalary(@Body() dto: CreateSalaryRecordDto): Promise<unknown> {
    return this.salariesService.create(dto);
  }

  @Post('salaries/generate')
  @Roles(UserRole.ADMIN)
  async generateSalary(
    @Body('teacherId') teacherId: string,
    @Body('month') month: string,
  ): Promise<unknown> {
    return this.salariesService.generateSalaryRecord(teacherId, new Date(month));
  }

  @Post('salaries/generate-monthly')
  @Roles(UserRole.ADMIN)
  async generateMonthlySalaries(
    @Body('year') year: number,
    @Body('month') month: number,
  ): Promise<unknown> {
    return this.salariesService.generateMonthlySalaries(year, month);
  }

  @Get('salaries/lessons/:lessonId/obligation')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getLessonObligation(@Param('lessonId') lessonId: string) {
    return this.salariesService.getLessonObligation(lessonId);
  }

  @Get('salaries/teacher/:teacherId/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getTeacherSalarySummary(
    @CurrentUser() user: JwtPayload,
    @Param('teacherId') teacherId: string,
  ) {
    await this.scope.assertManagerCanReadTeacher(user, teacherId);
    return this.salariesService.getTeacherSalarySummary(teacherId);
  }

  @Get('salaries/:teacherId/breakdown')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalaryBreakdown(
    @CurrentUser() user: JwtPayload,
    @Param('teacherId') teacherId: string,
    @Query('month') month: string,
  ) {
    if (!month) {
      throw new BadRequestException('Month parameter is required (format: YYYY-MM)');
    }
    await this.scope.assertManagerCanReadTeacher(user, teacherId);
    return this.salariesService.getSalaryBreakdown(teacherId, month);
  }

  @Get('salaries/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalary(@Param('id') id: string): Promise<unknown> {
    return this.salariesService.findById(id);
  }

  @Patch('salaries/:id')
  @Roles(UserRole.ADMIN)
  async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto): Promise<unknown> {
    return this.salariesService.update(id, dto);
  }

  @Patch('salaries/:id/process')
  @Roles(UserRole.ADMIN)
  async processSalary(@Param('id') id: string, @Body() dto: ProcessSalaryDto): Promise<unknown> {
    return this.salariesService.processSalary(id, dto);
  }

  @Delete('salaries/:id')
  @Roles(UserRole.ADMIN)
  async deleteSalary(@Param('id') id: string): Promise<unknown> {
    return this.salariesService.delete(id);
  }

  @Delete('salaries')
  @Roles(UserRole.ADMIN)
  async deleteSalaries(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required');
    }
    return this.salariesService.deleteMany(ids);
  }

  @Delete('salaries/breakdown/exclude')
  @Roles(UserRole.ADMIN)
  async excludeLessonsFromSalary(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required and cannot be empty');
    }
    return this.salariesService.excludeLessonsFromSalary(ids);
  }
}
