import { PrismaService } from '../prisma/prisma.service';
export declare class TeacherObligationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getObligationDetails(teacherId: string): Promise<{
        total: number;
        completed: number;
        items: {
            key: string;
            label: string;
            done: boolean;
            completedCount: number;
            totalCount: number;
            doneAt: string | undefined;
        }[];
    }>;
}
