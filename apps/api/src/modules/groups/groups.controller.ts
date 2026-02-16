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
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(@Query() query: QueryGroupDto) {
    return this.groupsService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      centerId: query.centerId,
      teacherId: query.teacherId,
      isActive: query.isActive,
      level: query.level,
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
  async findById(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    return this.groupsService.toggleActive(id);
  }

  @Patch(':id/assign-teacher')
  @Roles(UserRole.ADMIN)
  async assignTeacher(
    @Param('id') groupId: string,
    @Body('teacherId') teacherId: string,
  ) {
    return this.groupsService.assignTeacher(groupId, teacherId);
  }

  @Post(':id/students/:studentId')
  @Roles(UserRole.ADMIN)
  async addStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.addStudent(groupId, studentId);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.ADMIN)
  async removeStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.removeStudent(groupId, studentId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}
