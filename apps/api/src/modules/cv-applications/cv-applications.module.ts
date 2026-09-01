import { Module } from '@nestjs/common';
import { CvApplicationsController } from './cv-applications.controller';
import { CvApplicationsService } from './cv-applications.service';

@Module({
  controllers: [CvApplicationsController],
  providers: [CvApplicationsService],
})
export class CvApplicationsModule {}
