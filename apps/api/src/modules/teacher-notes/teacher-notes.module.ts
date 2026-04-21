import { Module } from '@nestjs/common';
import { TeacherNotesController } from './teacher-notes.controller';
import { TeacherNotesService } from './teacher-notes.service';

@Module({
  controllers: [TeacherNotesController],
  providers: [TeacherNotesService],
  exports: [TeacherNotesService],
})
export class TeacherNotesModule {}
