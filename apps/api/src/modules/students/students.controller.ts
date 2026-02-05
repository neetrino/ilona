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
    return this.studentsService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      groupId: query.groupId,
      status: query.status as UserStatus | undefined,
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
