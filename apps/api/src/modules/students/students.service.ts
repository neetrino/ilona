import { Injectable } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { UserRole, UserStatus } from '@prisma/client';
import { StudentCrudService } from './student-crud.service';
import { StudentQueryService } from './student-query.service';
import { StudentStatisticsService } from './student-statistics.service';
import { StudentGroupService } from './student-group.service';

/**
 * Main Students Service - Facade that delegates to specialized services
 * This maintains backward compatibility while keeping the codebase organized
 */
@Injectable()
export class StudentsService {
  constructor(
    private readonly crudService: StudentCrudService,
    private readonly queryService: StudentQueryService,
    private readonly statisticsService: StudentStatisticsService,
    private readonly groupService: StudentGroupService,
  ) {}

  // CRUD Methods
  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    groupIds?: string[];
    status?: UserStatus;
    statusIds?: UserStatus[];
    teacherId?: string;
    teacherIds?: string[];
    centerId?: string;
    centerIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    month?: number;
    year?: number;
  }) {
    return this.crudService.findAll(params);
  }

  async findById(id: string, currentUserId?: string, userRole?: UserRole) {
    return this.crudService.findById(id, currentUserId, userRole);
  }

  async findByUserId(userId: string) {
    return this.crudService.findByUserId(userId);
  }

  async create(dto: CreateStudentDto) {
    return this.crudService.create(dto);
  }

  async update(id: string, dto: UpdateStudentDto) {
    return this.crudService.update(id, dto);
  }

  async delete(id: string) {
    return this.crudService.delete(id);
  }

  // Query Methods
  async findAssignedToTeacher(teacherId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    return this.queryService.findAssignedToTeacher(teacherId, params);
  }

  async findAssignedToTeacherByUserId(userId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    return this.queryService.findAssignedToTeacherByUserId(userId, params);
  }

  async getMyTeachers(userId: string) {
    return this.queryService.getMyTeachers(userId);
  }

  // Statistics Methods
  async getStatistics(id: string, currentUserId?: string, userRole?: UserRole) {
    return this.statisticsService.getStatistics(id, currentUserId, userRole);
  }

  async getMyDashboard(userId: string) {
    return this.statisticsService.getMyDashboard(userId);
  }

  // Group Methods
  async changeGroup(id: string, newGroupId: string | null) {
    return this.groupService.changeGroup(id, newGroupId);
  }
}
