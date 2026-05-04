import { Injectable } from '@nestjs/common';
import { UserRole, LessonStatus } from '@ilona/database';
import { CreateLessonDto, UpdateLessonDto, CompleteLessonDto } from './dto';
import { LessonCrudService } from './lesson-crud.service';
import { LessonStatusService } from './lesson-status.service';
import { LessonActionsService } from './lesson-actions.service';
import { LessonSchedulingService } from './lesson-scheduling.service';
import { LessonStatisticsService } from './lesson-statistics.service';

/**
 * Main Lessons Service - Facade that delegates to specialized services
 * This maintains backward compatibility while keeping the codebase organized
 */
@Injectable()
export class LessonsService {
  constructor(
    private readonly crudService: LessonCrudService,
    private readonly statusService: LessonStatusService,
    private readonly actionsService: LessonActionsService,
    private readonly schedulingService: LessonSchedulingService,
    private readonly statisticsService: LessonStatisticsService,
  ) {}

  // CRUD Methods
  async findAll(params?: {
    skip?: number;
    take?: number;
    centerId?: string;
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    status?: LessonStatus;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    currentUserId?: string;
    userRole?: UserRole;
  }): Promise<unknown> {
    return this.crudService.findAll(params);
  }

  async findById(id: string, currentUserId?: string, userRole?: UserRole): Promise<unknown> {
    return this.crudService.findById(id, currentUserId, userRole);
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date): Promise<unknown> {
    return this.crudService.findByTeacher(teacherId, dateFrom, dateTo);
  }

  async getTodayLessons(teacherId: string): Promise<unknown> {
    return this.crudService.getTodayLessons(teacherId);
  }

  async getUpcoming(teacherId: string, limit = 10) {
    return this.crudService.getUpcoming(teacherId, limit);
  }

  async create(dto: CreateLessonDto, currentUserId?: string, userRole?: UserRole): Promise<unknown> {
    return this.crudService.create(dto, currentUserId, userRole);
  }

  async createBulk(lessons: CreateLessonDto[], currentUserId?: string, userRole?: UserRole): Promise<unknown> {
    return this.crudService.createBulk(lessons, currentUserId, userRole);
  }

  async update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole) {
    return this.crudService.update(id, dto, userId, userRole);
  }

  async setSubstituteForGroupDay(
    params: { groupId: string; date: string; substituteTeacherId: string | null },
    userId?: string,
    userRole?: UserRole,
  ): Promise<unknown> {
    return this.crudService.setSubstituteForGroupDay(params, userId, userRole);
  }

  async delete(id: string) {
    return this.crudService.delete(id);
  }

  async deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: UserRole) {
    return this.crudService.deleteBulk(lessonIds, currentUserId, userRole);
  }

  // Status Methods
  async startLesson(id: string, userId: string, userRole: UserRole) {
    return this.statusService.startLesson(id, userId, userRole);
  }

  async completeLesson(id: string, dto: CompleteLessonDto, userId: string, userRole: UserRole): Promise<unknown> {
    return this.statusService.completeLesson(id, dto, userId, userRole);
  }

  async cancelLesson(id: string, reason?: string, userId?: string, userRole?: UserRole) {
    return this.statusService.cancelLesson(id, reason, userId, userRole);
  }

  async markMissed(id: string) {
    return this.statusService.markMissed(id);
  }

  // Actions Methods
  async markVocabularySent(id: string) {
    return this.actionsService.markVocabularySent(id);
  }

  async markAbsenceComplete(id: string, userId?: string, userRole?: UserRole) {
    return this.actionsService.markAbsenceComplete(id, userId, userRole);
  }

  async markVoiceSent(id: string, userId?: string, userRole?: UserRole) {
    return this.actionsService.markVoiceSent(id, userId, userRole);
  }

  async markTextSent(id: string, userId?: string, userRole?: UserRole) {
    return this.actionsService.markTextSent(id, userId, userRole);
  }

  // Scheduling Methods
  async createRecurring(params: {
    groupId: string;
    teacherId: string;
    weekdays: number[];
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate: Date;
    topic?: string;
    description?: string;
  }): Promise<unknown> {
    return this.schedulingService.createRecurring(params);
  }

  // Statistics Methods
  async getLessonStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date, centerId?: string) {
    return this.statisticsService.getLessonStatistics(teacherId, dateFrom, dateTo, centerId);
  }
}
