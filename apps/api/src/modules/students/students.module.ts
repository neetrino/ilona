import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentCrudService } from './student-crud.service';
import { StudentQueryService } from './student-query.service';
import { StudentStatisticsService } from './student-statistics.service';
import { StudentGroupService } from './student-group.service';
import { StudentStreakService } from './student-streak.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    StudentCrudService,
    StudentQueryService,
    StudentStatisticsService,
    StudentGroupService,
    StudentStreakService,
  ],
  exports: [StudentsService, StudentStreakService],
})
export class StudentsModule {}


