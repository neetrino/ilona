import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: QueryTeacherDto) {
    return this.teachersService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.status as UserStatus | undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.teachersService.findByUserId(user.sub);
  }

  @Get('me/dashboard')
  @Roles(UserRole.TEACHER)
  async getMyDashboard(@CurrentUser() user: JwtPayload) {
    return this.teachersService.getMyDashboard(user.sub);
  }

  @Get('me/daily-plan')
  @Roles(UserRole.TEACHER)
  async getDailyPlan(
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.teachersService.getDailyPlan(user.sub, targetDate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    return this.teachersService.findById(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getStatistics(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.teachersService.getStatistics(
      id,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get(':id/obligation')
  @Roles(UserRole.ADMIN)
  async getObligationDetails(@Param('id') id: string) {
    return this.teachersService.getObligationDetails(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN)
  async deleteMany(@Body() body: { ids: string[] }) {
    return this.teachersService.deleteMany(body.ids);
  }
}
