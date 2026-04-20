import { Module, forwardRef } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { FinanceModule } from '../finance/finance.module';
import { StudentStreakService } from '../students/student-streak.service';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [AttendanceController],
  providers: [AttendanceService, StudentStreakService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
