import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherCrudService } from './teacher-crud.service';
import { TeacherListService } from './teacher-list.service';
import { TeacherReadService } from './teacher-read.service';
import { TeacherWriteService } from './teacher-write.service';
import { TeacherAccessService } from './teacher-access.service';
import { TeacherObligationService } from './teacher-obligation.service';
import { TeacherStatisticsService } from './teacher-statistics.service';

@Module({
  controllers: [TeachersController],
  providers: [
    TeachersService,
    TeacherCrudService,
    TeacherListService,
    TeacherReadService,
    TeacherWriteService,
    TeacherAccessService,
    TeacherObligationService,
    TeacherStatisticsService,
  ],
  exports: [TeachersService],
})
export class TeachersModule {}


