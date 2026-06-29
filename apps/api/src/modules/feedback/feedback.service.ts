import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto';
import { UserRole } from '@ilona/database';
import { FeedbackQueryService } from './feedback-query.service';
import { FeedbackWriteService } from './feedback-write.service';

/** Facade for feedback — delegates to query and write services. */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly queryService: FeedbackQueryService,
    private readonly writeService: FeedbackWriteService,
  ) {}

  getByLesson(lessonId: string) {
    return this.queryService.getByLesson(lessonId);
  }

  getByStudent(
    studentId: string,
    userId: string,
    userRole: UserRole,
    params?: {
      dateFrom?: Date;
      dateTo?: Date;
      teacherId?: string;
    },
  ) {
    return this.queryService.getByStudent(studentId, userId, userRole, params);
  }

  createOrUpdate(dto: CreateFeedbackDto, userId: string, userRole: UserRole) {
    return this.writeService.createOrUpdate(dto, userId, userRole);
  }

  update(id: string, dto: UpdateFeedbackDto, userId: string, userRole: UserRole) {
    return this.writeService.update(id, dto, userId, userRole);
  }

  delete(id: string, userId: string, userRole: UserRole) {
    return this.writeService.delete(id, userId, userRole);
  }
}
