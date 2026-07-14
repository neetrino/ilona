import { PrismaService } from '../prisma/prisma.service';
import type { AdminStudentRecordingFilters } from './message.types';
export declare class MessageRecordingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStudentVoiceToTeacherRecordings(studentUserId: string, filters?: {
        year?: number;
        month?: number;
        day?: number;
    }): Promise<{
        id: string;
        fileUrl: string | null;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        teacher: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    }[]>;
    getAdminStudentRecordings(_adminUserId: string, filters?: AdminStudentRecordingFilters, branchCenterId?: string): Promise<{
        id: string;
        fileUrl: string;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        student: {
            userId: string;
            firstName: string;
            lastName: string;
        };
        group: {
            id: string | null;
            name: string;
        };
    }[]>;
    getTeacherStudentRecordings(teacherUserId: string, filters?: AdminStudentRecordingFilters): Promise<{
        id: string;
        fileUrl: string;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        student: {
            userId: string;
            firstName: string;
            lastName: string;
        };
        group: {
            id: string | null;
            name: string;
        };
    }[]>;
}
