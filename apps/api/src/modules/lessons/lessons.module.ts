import { Module, forwardRef } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonCrudService } from './lesson-crud.service';
import { LessonStatusService } from './lesson-status.service';
import { LessonActionsService } from './lesson-actions.service';
import { LessonSchedulingService } from './lesson-scheduling.service';
import { LessonStatisticsService } from './lesson-statistics.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [LessonsController],
  providers: [
    LessonsService,
    LessonEnrichmentService,
    LessonCrudService,
    LessonStatusService,
    LessonActionsService,
    LessonSchedulingService,
    LessonStatisticsService,
  ],
  exports: [LessonsService],
})
export class LessonsModule {}
