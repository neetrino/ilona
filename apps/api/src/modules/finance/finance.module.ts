import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PaymentsService } from './payments.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [FinanceController],
  providers: [FinanceService, PaymentsService, SalariesService, DeductionsService],
  exports: [FinanceService, PaymentsService, SalariesService, DeductionsService],
})
export class FinanceModule {}
