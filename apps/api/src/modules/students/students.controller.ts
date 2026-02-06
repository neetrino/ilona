import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async findAll(@Query() query: QueryStudentDto) {
    // Handle array query params (e.g., ?teacherIds=id1&teacherIds=id2)
    const teacherIds = query.teacherIds || (query.teacherId ? [query.teacherId] : undefined);
    const centerIds = query.centerIds || (query.centerId ? [query.centerId] : undefined);
    const statusIds = query.statusIds || (query.status ? [query.status] : undefined);

    return this.studentsService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      groupId: query.groupId,
      status: query.status as UserStatus | undefined,
      statusIds: statusIds as UserStatus[] | undefined,
      teacherId: query.teacherId,
      teacherIds,
      centerId: query.centerId,
      centerIds,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      month: query.month,
      year: query.year,
    });
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.studentsService.findByUserId(user.sub);
  }

  @Get('me/dashboard')
  @Roles(UserRole.STUDENT)
  async getMyDashboard(@CurrentUser() user: JwtPayload) {
    return this.studentsService.getMyDashboard(user.sub);
  }

  @Get('me/assigned')
  @Roles(UserRole.TEACHER)
  async getMyAssignedStudents(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStudentDto,
  ) {
    return this.studentsService.findAssignedToTeacherByUserId(user.sub, {
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.status as UserStatus | undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getStatistics(@Param('id') id: string) {
    return this.studentsService.getStatistics(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/group')
  @Roles(UserRole.ADMIN)
  async changeGroup(
    @Param('id') id: string,
    @Body('groupId') groupId: string | null,
  ) {
    return this.studentsService.changeGroup(id, groupId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }
}
