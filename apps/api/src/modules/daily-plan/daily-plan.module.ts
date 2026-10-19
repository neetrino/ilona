import { Module, forwardRef } from '@nestjs/common';
import { DailyPlanCommentService } from './daily-plan-comment.service';
import { DailyPlanController } from './daily-plan.controller';
import { DailyPlanService } from './daily-plan.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [DailyPlanController],
  providers: [DailyPlanService, DailyPlanCommentService],
  exports: [DailyPlanService],
})
export class DailyPlanModule {}
