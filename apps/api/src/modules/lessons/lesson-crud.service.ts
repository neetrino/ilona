import { Injectable } from '@nestjs/common';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { LessonStatus, UserRole } from '@ilona/database';
import { LessonListService } from './lesson-list.service';
import { LessonReadService } from './lesson-read.service';
import { LessonCreateService } from './lesson-create.service';
import { LessonUpdateService } from './lesson-update.service';
import { LessonDeleteService } from './lesson-delete.service';

/** Facade for lesson CRUD — delegates to domain-specific services. */
@Injectable()
export class LessonCrudService {
  constructor(
    private readonly listService: LessonListService,
    private readonly readService: LessonReadService,
    private readonly createService: LessonCreateService,
    private readonly updateService: LessonUpdateService,
    private readonly deleteService: LessonDeleteService,
  ) {}

  findAll(params?: {
    skip?: number;
    take?: number;
    centerId?: string;
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    teacherIds?: string[];
    status?: LessonStatus;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    return this.listService.findAll(params);
  }

  findById(id: string, currentUserId?: string, userRole?: UserRole) {
    return this.readService.findById(id, currentUserId, userRole);
  }

  findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    return this.listService.findByTeacher(teacherId, dateFrom, dateTo);
  }

  getTodayLessons(teacherId: string) {
    return this.listService.getTodayLessons(teacherId);
  }

  getUpcoming(teacherId: string, limit = 10) {
    return this.listService.getUpcoming(teacherId, limit);
  }

  create(dto: CreateLessonDto, currentUserId?: string, userRole?: UserRole) {
    return this.createService.create(dto, currentUserId, userRole);
  }

  createBulk(lessons: CreateLessonDto[], currentUserId?: string, userRole?: UserRole) {
    return this.createService.createBulk(lessons, currentUserId, userRole);
  }

  update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole) {
    return this.updateService.update(id, dto, userId, userRole);
  }

  setSubstituteForGroupDay(
    params: { groupId: string; date: string; substituteTeacherId: string | null },
    userId: string | undefined,
    userRole: UserRole | undefined,
  ) {
    return this.updateService.setSubstituteForGroupDay(params, userId, userRole);
  }

  delete(id: string) {
    return this.deleteService.delete(id);
  }

  deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: UserRole) {
    return this.deleteService.deleteBulk(lessonIds, currentUserId, userRole);
  }
}
