import { Module, forwardRef } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceLessonQueryService } from './attendance-lesson-query.service';
import { AttendanceStudentQueryService } from './attendance-student-query.service';
import { AttendanceReportService } from './attendance-report.service';
import { AttendanceWriteService } from './attendance-write.service';
import { AttendancePlannedAbsenceService } from './attendance-planned-absence.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceScopeService,
    AttendanceLessonQueryService,
    AttendanceStudentQueryService,
    AttendanceReportService,
    AttendanceWriteService,
    AttendancePlannedAbsenceService,
    AttendanceSideEffectsService,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}
