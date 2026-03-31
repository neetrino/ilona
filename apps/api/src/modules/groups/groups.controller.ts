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
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, QueryGroupDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findAll(@Query() query: QueryGroupDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.groupsService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      centerId: query.centerId,
      teacherId: query.teacherId,
      isActive: query.isActive,
      level: query.level,
      includeStudents: query.includeStudents,
      currentUser: user,
    });
  }

  @Get('my-groups')
  @Roles(UserRole.TEACHER)
  async getMyGroups(@CurrentUser() user: JwtPayload) {
    // Use canonical method to get teacher groups by userId
    // This ensures consistency with chat service and other endpoints
    return this.groupsService.findByTeacherUserId(user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findById(@Param('id') id: string, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.groupsService.findById(id, user);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getGroupStudents(
    @Param('id') groupId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<unknown> {
    const skipNum = skip !== undefined ? parseInt(skip, 10) : 0;
    const takeNum = take !== undefined ? Math.min(parseInt(take, 10), 100) : 20;
    return this.groupsService.findStudentsByGroupId(groupId, {
      skip: Number.isNaN(skipNum) ? 0 : skipNum,
      take: Number.isNaN(takeNum) ? 20 : takeNum,
    }, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() dto: CreateGroupDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.groupsService.create(dto, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.groupsService.update(id, dto, user);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async toggleActive(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.groupsService.toggleActive(id, user);
  }

  @Patch(':id/assign-teacher')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async assignTeacher(
    @Param('id') groupId: string,
    @Body('teacherId') teacherId: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<unknown> {
    return this.groupsService.assignTeacher(groupId, teacherId, user);
  }

  @Post(':id/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.groupsService.addStudent(groupId, studentId, user);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.groupsService.removeStudent(groupId, studentId, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.groupsService.delete(id, user);
  }
}
