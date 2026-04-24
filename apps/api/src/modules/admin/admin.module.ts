import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { CentersModule } from '../centers/centers.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [CrmModule, CentersModule],
  controllers: [AdminController],
})
export class AdminModule {}
