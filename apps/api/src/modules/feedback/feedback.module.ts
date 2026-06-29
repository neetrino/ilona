import { Module, forwardRef } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackQueryService } from './feedback-query.service';
import { FeedbackWriteService } from './feedback-write.service';
import { FeedbackCompletionService } from './feedback-completion.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    FeedbackQueryService,
    FeedbackWriteService,
    FeedbackCompletionService,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}

