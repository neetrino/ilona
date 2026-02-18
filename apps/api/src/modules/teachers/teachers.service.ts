import { Injectable } from '@nestjs/common';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserStatus } from '@prisma/client';
import { TeacherCrudService } from './teacher-crud.service';
import { TeacherObligationService } from './teacher-obligation.service';
import { TeacherStatisticsService } from './teacher-statistics.service';

/**
 * Main Teachers Service - Facade that delegates to specialized services
 * This maintains backward compatibility while keeping the codebase organized
 */
@Injectable()
export class TeachersService {
  constructor(
    private readonly crudService: TeacherCrudService,
    private readonly obligationService: TeacherObligationService,
    private readonly statisticsService: TeacherStatisticsService,
  ) {}

  // CRUD Methods
  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.crudService.findAll(params);
  }

  async findById(id: string) {
    return this.crudService.findById(id);
  }

  async findByUserId(userId: string) {
    return this.crudService.findByUserId(userId);
  }

  async create(dto: CreateTeacherDto) {
    return this.crudService.create(dto);
  }

  async update(id: string, dto: UpdateTeacherDto) {
    return this.crudService.update(id, dto);
  }

  async delete(id: string) {
    return this.crudService.delete(id);
  }

  async deleteMany(ids: string[]) {
    return this.crudService.deleteMany(ids);
  }

  // Obligation Methods
  async getObligationDetails(teacherId: string) {
    return this.obligationService.getObligationDetails(teacherId);
  }

  // Statistics Methods
  async getStatistics(id: string, dateFrom?: Date, dateTo?: Date) {
    return this.statisticsService.getStatistics(id, dateFrom, dateTo);
  }

  async getMyDashboard(userId: string) {
    return this.statisticsService.getMyDashboard(userId);
  }

  async getDailyPlan(userId: string, date: Date) {
    return this.statisticsService.getDailyPlan(userId, date);
  }
}
