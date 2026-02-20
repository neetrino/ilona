import { Injectable } from '@nestjs/common';
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
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    status?: any;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    currentUserId?: string;
    userRole?: any;
  }) {
    return this.crudService.findAll(params);
  }

  async findById(id: string, currentUserId?: string, userRole?: any) {
    return this.crudService.findById(id, currentUserId, userRole);
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    return this.crudService.findByTeacher(teacherId, dateFrom, dateTo);
  }

  async getTodayLessons(teacherId: string) {
    return this.crudService.getTodayLessons(teacherId);
  }

  async getUpcoming(teacherId: string, limit = 10) {
    return this.crudService.getUpcoming(teacherId, limit);
  }

  async create(dto: CreateLessonDto) {
    return this.crudService.create(dto);
  }

  async createBulk(lessons: CreateLessonDto[]) {
    return this.crudService.createBulk(lessons);
  }

  async update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: any) {
    return this.crudService.update(id, dto, userId, userRole);
  }

  async delete(id: string) {
    return this.crudService.delete(id);
  }

  async deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: any) {
    return this.crudService.deleteBulk(lessonIds, currentUserId, userRole);
  }

  // Status Methods
  async startLesson(id: string, userId: string, userRole: any) {
    return this.statusService.startLesson(id, userId, userRole);
  }

  async completeLesson(id: string, dto: CompleteLessonDto, userId: string, userRole: any) {
    return this.statusService.completeLesson(id, dto, userId, userRole);
  }

  async cancelLesson(id: string, reason?: string) {
    return this.statusService.cancelLesson(id, reason);
  }

  async markMissed(id: string) {
    return this.statusService.markMissed(id);
  }

  // Actions Methods
  async markVocabularySent(id: string) {
    return this.actionsService.markVocabularySent(id);
  }

  async markAbsenceComplete(id: string) {
    return this.actionsService.markAbsenceComplete(id);
  }

  async markVoiceSent(id: string) {
    return this.actionsService.markVoiceSent(id);
  }

  async markTextSent(id: string) {
    return this.actionsService.markTextSent(id);
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
  }) {
    return this.schedulingService.createRecurring(params);
  }

  // Statistics Methods
  async getLessonStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date) {
    return this.statisticsService.getLessonStatistics(teacherId, dateFrom, dateTo);
  }
}
