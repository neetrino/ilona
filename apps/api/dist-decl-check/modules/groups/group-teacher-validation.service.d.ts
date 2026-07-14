import { PrismaService } from '../prisma/prisma.service';
export declare class GroupTeacherValidationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validateGroupTeachers(params: {
        teacherId?: string | null;
        secondTeacherId?: string | null;
        requireBoth?: boolean;
    }): void;
    assertTeachersExist(teacherIds: string[]): Promise<void>;
    assertTeachersBelongToCenter(centerId: string, teacherIds: string[]): Promise<void>;
}
