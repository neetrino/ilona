import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { TeacherLeadsController } from './teacher-leads.controller';
import { LeadsService } from './leads.service';
import { LeadAccessService } from './lead-access.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadListService } from './lead-list.service';
import { LeadReadService } from './lead-read.service';
import { LeadCreateService } from './lead-create.service';
import { LeadUpdateService } from './lead-update.service';
import { LeadDeleteService } from './lead-delete.service';
import { LeadStatusService } from './lead-status.service';
import { LeadVoiceService } from './lead-voice.service';
import { LeadTeacherService } from './lead-teacher.service';
import { StorageModule } from '../storage/storage.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [StorageModule, StudentsModule],
  controllers: [LeadsController, TeacherLeadsController],
  providers: [
    LeadsService,
    LeadAccessService,
    LeadActivityService,
    LeadListService,
    LeadReadService,
    LeadCreateService,
    LeadUpdateService,
    LeadDeleteService,
    LeadStatusService,
    LeadVoiceService,
    LeadTeacherService,
  ],
  exports: [LeadsService],
})
export class CrmModule {}
