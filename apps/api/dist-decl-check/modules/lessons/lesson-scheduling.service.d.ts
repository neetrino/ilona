import { PrismaService } from '../prisma/prisma.service';
import { LessonCrudService } from './lesson-crud.service';
export declare class LessonSchedulingService {
    private readonly prisma;
    private readonly crudService;
    constructor(prisma: PrismaService, crudService: LessonCrudService);
    createRecurring(params: {
        groupId: string;
        teacherId: string;
        weekdays: number[];
        startTime: string;
        endTime: string;
        startDate: Date;
        endDate: Date;
        topic?: string;
        description?: string;
    }): Promise<unknown>;
}
