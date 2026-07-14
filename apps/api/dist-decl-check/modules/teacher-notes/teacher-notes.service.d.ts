import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherNoteDto } from './dto/create-teacher-note.dto';
export declare class TeacherNotesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveTeacherId;
    listForUser(userId: string): Promise<{
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
    }[]>;
    createForUser(userId: string, dto: CreateTeacherNoteDto): Promise<{
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
    }>;
    removeForUser(userId: string, noteId: string): Promise<{
        success: boolean;
    }>;
}
