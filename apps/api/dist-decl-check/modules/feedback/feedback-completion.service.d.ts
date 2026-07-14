import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
export declare class FeedbackCompletionService {
    private readonly prisma;
    private readonly salariesService;
    constructor(prisma: PrismaService, salariesService: SalariesService);
    syncLessonFeedbacksCompleted(lessonId: string): Promise<void>;
}
