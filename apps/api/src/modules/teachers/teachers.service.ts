import { Injectable } from '@nestjs/common';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserStatus } from '@ilona/database';
import { TeacherCrudService } from './teacher-crud.service';
import { TeacherObligationService } from './teacher-obligation.service';
import { TeacherStatisticsService } from './teacher-statistics.service';
import { JwtPayload } from '../../common/types/auth.types';

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
    currentUser?: JwtPayload;
  }): Promise<unknown> {
    return this.crudService.findAll(params);
  }

  async findById(id: string, currentUser?: JwtPayload): Promise<unknown> {
    return this.crudService.findById(id, currentUser);
  }

  async findByUserId(userId: string): Promise<unknown> {
    return this.crudService.findByUserId(userId);
  }

  async create(dto: CreateTeacherDto, currentUser?: JwtPayload): Promise<unknown> {
    return this.crudService.create(dto, currentUser);
  }

  async update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload): Promise<unknown> {
    return this.crudService.update(id, dto, currentUser);
  }

  async delete(id: string, currentUser?: JwtPayload) {
    return this.crudService.delete(id, currentUser);
  }

  async deleteMany(ids: string[], currentUser?: JwtPayload) {
    return this.crudService.deleteMany(ids, currentUser);
  }

  // Obligation Methods
  async getObligationDetails(teacherId: string, currentUser?: JwtPayload) {
    if (currentUser?.role === 'MANAGER') {
      const teacher = await this.crudService.findById(teacherId, currentUser);
      if (!teacher) {
        return null;
      }
    }
    return this.obligationService.getObligationDetails(teacherId);
  }

  // Statistics Methods
  async getStatistics(id: string, dateFrom?: Date, dateTo?: Date, currentUser?: JwtPayload): Promise<unknown> {
    return this.statisticsService.getStatistics(id, dateFrom, dateTo, currentUser);
  }

  async getMyDashboard(userId: string): Promise<unknown> {
    return this.statisticsService.getMyDashboard(userId);
  }

  async getDailyPlan(userId: string, date: Date): Promise<unknown> {
    return this.statisticsService.getDailyPlan(userId, date);
  }
}
