import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CvApplicationsController } from './cv-applications.controller';
import { CvApplicationsService } from './cv-applications.service';

@Module({
  imports: [StorageModule],
  controllers: [CvApplicationsController],
  providers: [CvApplicationsService],
})
export class CvApplicationsModule {}
