import { Module, forwardRef } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonCrudService } from './lesson-crud.service';
import { LessonListService } from './lesson-list.service';
import { LessonReadService } from './lesson-read.service';
import { LessonCreateService } from './lesson-create.service';
import { LessonUpdateService } from './lesson-update.service';
import { LessonDeleteService } from './lesson-delete.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { LessonStatusService } from './lesson-status.service';
import { LessonActionsService } from './lesson-actions.service';
import { LessonSchedulingService } from './lesson-scheduling.service';
import { LessonStatisticsService } from './lesson-statistics.service';
import { GroupScheduleLessonsService } from './group-schedule-lessons.service';
import { GroupScheduleRollingService } from './group-schedule-rolling.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [LessonsController],
  providers: [
    LessonsService,
    LessonEnrichmentService,
    LessonCrudService,
    LessonListService,
    LessonReadService,
    LessonCreateService,
    LessonUpdateService,
    LessonDeleteService,
    LessonManagerAccessService,
    LessonStatusService,
    LessonActionsService,
    LessonSchedulingService,
    LessonStatisticsService,
    GroupScheduleLessonsService,
    GroupScheduleRollingService,
  ],
  exports: [LessonsService, GroupScheduleLessonsService, GroupScheduleRollingService],
})
export class LessonsModule {}
