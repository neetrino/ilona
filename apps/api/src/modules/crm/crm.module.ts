import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { TeacherLeadsController } from './teacher-leads.controller';
import { LeadsService } from './leads.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [LeadsController, TeacherLeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class CrmModule {}
