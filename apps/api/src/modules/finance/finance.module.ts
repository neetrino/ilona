import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PaymentsService } from './payments.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { SalaryCalculationService } from './salary-calculation.service';
import { SalaryGenerationService } from './salary-generation.service';
import { SalaryRecordService } from './salary-record.service';
import { SalaryBreakdownService } from './salary-breakdown.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    PaymentsService,
    SalariesService,
    DeductionsService,
    SalaryCalculationService,
    SalaryGenerationService,
    SalaryRecordService,
    SalaryBreakdownService,
  ],
  exports: [FinanceService, PaymentsService, SalariesService, DeductionsService],
})
export class FinanceModule {}
