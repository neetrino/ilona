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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserRole, UserStatus, StudentStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findAll(@Query() query: QueryStudentDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    // Handle array query params (e.g., ?teacherIds=id1&teacherIds=id2)
    const teacherIds = query.teacherIds || (query.teacherId ? [query.teacherId] : undefined);
    const centerIds = query.centerIds || (query.centerId ? [query.centerId] : undefined);
    const statusIds = query.statusIds || (query.status ? [query.status] : undefined);
    // Handle both single groupId (backward compatibility) and groupIds array
    const groupIds = query.groupIds || (query.groupId ? [query.groupId] : undefined);
    const managerCenterId = getManagerCenterIdOrThrow(user);

    return this.studentsService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      groupId: query.groupId,
      groupIds,
      status: query.status as UserStatus | undefined,
      statusIds: statusIds as UserStatus[] | undefined,
      teacherId: query.teacherId,
      teacherIds,
      centerId: managerCenterId ?? query.centerId,
      centerIds: managerCenterId ? [managerCenterId] : centerIds,
      lifecycleStatuses: query.lifecycleStatuses as StudentStatus[] | undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      month: query.month,
      year: query.year,
      currentUserId: user?.sub,
      userRole: user?.role,
    });
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  async getMyProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.studentsService.findByUserId(user.sub);
  }

  @Get('me/dashboard')
  @Roles(UserRole.STUDENT)
  async getMyDashboard(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.studentsService.getMyDashboard(user.sub);
  }

  @Get('me/assigned')
  @Roles(UserRole.TEACHER)
  async getMyAssignedStudents(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStudentDto,
  ): Promise<unknown> {
    return this.studentsService.findAssignedToTeacherByUserId(user.sub, {
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.status as UserStatus | undefined,
      groupId: query.groupId,
    });
  }

  @Get('me/teachers')
  @Roles(UserRole.STUDENT)
  async getMyTeachers(@CurrentUser() user: JwtPayload) {
    return this.studentsService.getMyTeachers(user.sub);
  }

  @Get('featured-avatars')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getFeaturedAvatars(@Query('limit') limitRaw?: string) {
    const n = Math.min(8, Math.max(1, parseInt(String(limitRaw ?? '4'), 10) || 4));
    const items = await this.studentsService.getFeaturedAvatarsForMarketing(n);
    return { items };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findById(@Param('id') id: string, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.studentsService.findById(id, user?.sub, user?.role);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async getStatistics(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.studentsService.getStatistics(id, user?.sub, user?.role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.studentsService.create(dto, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.studentsService.update(id, dto, user);
  }

  @Patch(':id/group')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async changeGroup(
    @Param('id') id: string,
    @Body('groupId') groupId: string | null,
    @CurrentUser() user?: JwtPayload,
  ): Promise<unknown> {
    return this.studentsService.changeGroup(id, groupId, user);
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteBulk(@Body() body: { ids: string[] }, @CurrentUser() user?: JwtPayload) {
    return this.studentsService.deleteMany(body.ids ?? [], user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.studentsService.delete(id, user);
  }
}
