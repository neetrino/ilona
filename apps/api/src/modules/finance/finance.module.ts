import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceTeacherController } from './finance-teacher.controller';
import { FinanceStudentController } from './finance-student.controller';
import { FinanceDashboardController } from './finance-dashboard.controller';
import { FinancePaymentsController } from './finance-payments.controller';
import { FinanceSalariesController } from './finance-salaries.controller';
import { FinanceDeductionsController } from './finance-deductions.controller';
import { FinanceControllerScopeService } from './finance-controller-scope.service';
import { PaymentsService } from './payments.service';
import { PaymentQueryService } from './payment-query.service';
import { PaymentWriteService } from './payment-write.service';
import { PaymentSummaryService } from './payment-summary.service';
import { PaymentLifecycleService } from './payment-lifecycle.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { SalaryCalculationService } from './salary-calculation.service';
import { SalaryGenerationService } from './salary-generation.service';
import { SalaryRecordService } from './salary-record.service';
import { SalaryRecordListService } from './salary-record-list.service';
import { SalaryRecordReadService } from './salary-record-read.service';
import { SalaryRecordWriteService } from './salary-record-write.service';
import { SalaryBreakdownService } from './salary-breakdown.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [
    FinanceTeacherController,
    FinanceStudentController,
    FinanceDashboardController,
    FinancePaymentsController,
    FinanceSalariesController,
    FinanceDeductionsController,
  ],
  providers: [
    FinanceControllerScopeService,
    FinanceService,
    PaymentsService,
    PaymentQueryService,
    PaymentWriteService,
    PaymentSummaryService,
    PaymentLifecycleService,
    SalariesService,
    DeductionsService,
    SalaryCalculationService,
    SalaryGenerationService,
    SalaryRecordService,
    SalaryRecordListService,
    SalaryRecordReadService,
    SalaryRecordWriteService,
    SalaryBreakdownService,
  ],
  exports: [FinanceService, PaymentsService, SalariesService, DeductionsService],
})
export class FinanceModule {}
