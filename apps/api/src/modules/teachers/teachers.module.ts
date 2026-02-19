import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherCrudService } from './teacher-crud.service';
import { TeacherObligationService } from './teacher-obligation.service';
import { TeacherStatisticsService } from './teacher-statistics.service';

@Module({
  controllers: [TeachersController],
  providers: [
    TeachersService,
    TeacherCrudService,
    TeacherObligationService,
    TeacherStatisticsService,
  ],
  exports: [TeachersService],
})
export class TeachersModule {}


