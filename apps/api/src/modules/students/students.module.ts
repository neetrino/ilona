import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentCrudService } from './student-crud.service';
import { StudentListService } from './student-list.service';
import { StudentReadService } from './student-read.service';
import { StudentCreateService } from './student-create.service';
import { StudentUpdateService } from './student-update.service';
import { StudentDeleteService } from './student-delete.service';
import { StudentManagerAccessService } from './student-manager-access.service';
import { StudentQueryService } from './student-query.service';
import { StudentStatisticsService } from './student-statistics.service';
import { StudentGroupService } from './student-group.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    StudentCrudService,
    StudentListService,
    StudentReadService,
    StudentCreateService,
    StudentUpdateService,
    StudentDeleteService,
    StudentManagerAccessService,
    StudentQueryService,
    StudentStatisticsService,
    StudentGroupService,
  ],
  exports: [StudentsService, StudentCrudService],
})
export class StudentsModule {}
