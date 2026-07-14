import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';
export declare class StudentNotesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveStudentId;
    listForUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        studentId: string;
    }[]>;
    createForUser(userId: string, dto: CreateStudentNoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        studentId: string;
    }>;
    removeForUser(userId: string, noteId: string): Promise<{
        success: boolean;
    }>;
}
