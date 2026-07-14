import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';
import { StudentNotesService } from './student-notes.service';
export declare class StudentNotesController {
    private readonly service;
    constructor(service: StudentNotesService);
    list(user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        studentId: string;
    }[]>;
    create(user: JwtPayload, dto: CreateStudentNoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        studentId: string;
    }>;
    remove(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
